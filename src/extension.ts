// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Disable VS Code's built-in chat features
	disableBuiltInChat(context);

	// Register the webview view provider for the chat view container
	const provider = new CustomChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('vsctrwhCustomChat', provider)
	);

	// Helper function to open and reveal the chat view
	async function openChatView() {
		// Reveal the view directly - the container will show automatically
		const providerInstance = CustomChatViewProvider.getInstance();
		if (providerInstance && providerInstance._view) {
			// View is already resolved, show it
			providerInstance.reveal();
		} else {
			// View not resolved yet - show a message and the view will appear when container is opened
			// The view will automatically show when the user clicks the Chat icon in activity bar
			// or when the container becomes visible
			vscode.window.showInformationMessage('Please click the Chat icon in the activity bar to open the chat view.');
		}
	}

	// Register command to open custom chat (reveal the view)
	const openChatDisposable = vscode.commands.registerCommand('vsctrwh.openChat', openChatView);

	// Override built-in chat commands to show our custom chat instead
	const overrideChatDisposable = vscode.commands.registerCommand('workbench.action.chat.open', openChatView);

	const overrideInlineChatDisposable = vscode.commands.registerCommand('workbench.action.chat.openInEditor', openChatView);

	context.subscriptions.push(
		openChatDisposable,
		overrideChatDisposable,
		overrideInlineChatDisposable
	);

	console.log('Custom Chat Extension "vsctrwh" is now active!');
}

class CustomChatViewProvider implements vscode.WebviewViewProvider {
	public _view?: vscode.WebviewView;
	private static instance: CustomChatViewProvider | undefined;

	constructor(private readonly _extensionUri: vscode.Uri) {
		CustomChatViewProvider.instance = this;
	}

	public static getInstance(): CustomChatViewProvider | undefined {
		return CustomChatViewProvider.instance;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getWebviewContent(webviewView.webview);

		// Show the view immediately when resolved
		webviewView.show(true);

		// Show the view when it becomes visible
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				// View is now visible - ensure it's shown
				webviewView.show(true);
			}
		});

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'sendMessage':
						this.handleChatMessage(message.text);
						return;
					case 'clearChat':
						this.clearChat();
						return;
				}
			},
			undefined,
			[]
		);
	}

	public reveal() {
		if (this._view) {
			// Show the view - this will also show the container if needed
			this._view.show(true);
		} else {
			// View not resolved yet, it will show when resolved
			console.log('View not resolved yet, will show when ready');
		}
	}

	private handleChatMessage(text: string) {
		// Handle the chat message here
		// You can integrate with any chat API or service
		console.log('Received message:', text);

		// Send response back to webview
		if (this._view) {
			// Example: You could call an API here
			// For now, the webview handles the response simulation
		}
	}

	private clearChat() {
		if (this._view) {
			this._view.webview.postMessage({ command: 'clearChat' });
		}
	}

	private getWebviewContent(webview: vscode.Webview): string {
		// For now, return inline HTML. In production, you might want to read from a file
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Custom Chat</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: var(--vscode-font-family);
			background-color: var(--vscode-editor-background);
			color: var(--vscode-foreground);
			height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.chat-container {
			display: flex;
			flex-direction: column;
			height: 100%;
			padding: 16px;
		}

		.chat-header {
			padding: 12px 16px;
			border-bottom: 1px solid var(--vscode-panel-border);
			margin-bottom: 16px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.chat-header h2 {
			font-size: 18px;
			font-weight: 600;
		}

		.clear-button {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			padding: 6px 12px;
			border-radius: 2px;
			cursor: pointer;
			font-size: 12px;
		}

		.clear-button:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		.messages-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px 0;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.message {
			display: flex;
			flex-direction: column;
			gap: 4px;
			animation: fadeIn 0.3s ease-in;
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.message.user {
			align-items: flex-end;
		}

		.message.assistant {
			align-items: flex-start;
		}

		.message-bubble {
			max-width: 70%;
			padding: 12px 16px;
			border-radius: 8px;
			word-wrap: break-word;
			line-height: 1.5;
		}

		.message.user .message-bubble {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}

		.message.assistant .message-bubble {
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
		}

		.message-time {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			padding: 0 4px;
		}

		.input-container {
			display: flex;
			gap: 8px;
			padding-top: 16px;
			border-top: 1px solid var(--vscode-panel-border);
		}

		.input-field {
			flex: 1;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			padding: 10px 14px;
			border-radius: 4px;
			font-size: 14px;
			font-family: var(--vscode-font-family);
			resize: none;
			min-height: 44px;
			max-height: 120px;
		}

		.input-field:focus {
			outline: 1px solid var(--vscode-focusBorder);
			outline-offset: -1px;
		}

		.send-button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 10px 20px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			align-self: flex-end;
		}

		.send-button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.send-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.empty-state {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			gap: 12px;
			color: var(--vscode-descriptionForeground);
			text-align: center;
			padding: 40px;
		}

		.empty-state h3 {
			font-size: 16px;
			font-weight: 500;
			color: var(--vscode-foreground);
		}
	</style>
</head>
<body>
	<div class="chat-container">
		<div class="chat-header">
			<h2>Custom Chat</h2>
			<button class="clear-button" id="clearButton">Clear Chat</button>
		</div>
		<div class="messages-container" id="messagesContainer">
			<div class="empty-state">
				<h3>Welcome to Custom Chat</h3>
				<p>Start a conversation by typing a message below.</p>
			</div>
		</div>
		<div class="input-container">
			<textarea 
				id="messageInput" 
				class="input-field" 
				placeholder="Type your message here.."
				rows="1"
			></textarea>
			<button class="send-button" id="sendButton">Send</button>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const messagesContainer = document.getElementById('messagesContainer');
		const messageInput = document.getElementById('messageInput');
		const sendButton = document.getElementById('sendButton');
		const clearButton = document.getElementById('clearButton');

		let messageHistory = [];

		// Auto-resize textarea
		messageInput.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 120) + 'px';
		});

		// Handle Enter key (send) vs Shift+Enter (new line)
		messageInput.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});

		function sendMessage() {
			const message = messageInput.value.trim();
			if (!message) {
				return;
			}

			// Add user message to UI
			addMessage('user', message);
			
			// Clear input
			messageInput.value = '';
			messageInput.style.height = 'auto';
			sendButton.disabled = true;

			// Send message to extension
			vscode.postMessage({
				command: 'sendMessage',
				text: message
			});

			// Show typing indicator
			const typingId = addMessage('assistant', 'Thinking...', true);
			
			// Simulate response (replace with actual API call)
			setTimeout(() => {
				removeMessage(typingId);
				const response = generateResponse(message);
				addMessage('assistant', response);
			}, 1000);
		}

		function addMessage(role, text, isTemporary = false) {
			// Remove empty state if present
			const emptyState = messagesContainer.querySelector('.empty-state');
			if (emptyState) {
				emptyState.remove();
			}

			const messageId = 'msg-' + Date.now() + '-' + Math.random();
			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${role}\`;
			messageDiv.id = messageId;
			messageDiv.setAttribute('data-temporary', isTemporary);

			const bubble = document.createElement('div');
			bubble.className = 'message-bubble';
			bubble.textContent = text;

			const time = document.createElement('div');
			time.className = 'message-time';
			time.textContent = new Date().toLocaleTimeString();

			messageDiv.appendChild(bubble);
			messageDiv.appendChild(time);

			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;

			if (!isTemporary) {
				messageHistory.push({ role, text, id: messageId });
			}

			return messageId;
		}

		function removeMessage(messageId) {
			const message = document.getElementById(messageId);
			if (message) {
				message.remove();
			}
		}

		function generateResponse(userMessage) {
			// Placeholder response - replace with actual API integration
			const responses = [
				\`I received your message: "\${userMessage}". This is a custom chat interface. You can integrate this with any chat API or service.\`,
				\`Thanks for your message! This custom chat has replaced VS Code's built-in chat. How can I help you?\`,
				\`I understand you said: "\${userMessage}". This extension allows you to use your own chat backend.\`
			];
			return responses[Math.floor(Math.random() * responses.length)];
		}

		function clearChat() {
			messagesContainer.innerHTML = \`
				<div class="empty-state">
					<h3>Welcome to Custom Chat</h3>
					<p>Start a conversation by typing a message below.</p>
				</div>
			\`;
			messageHistory = [];
		}

		sendButton.addEventListener('click', sendMessage);
		clearButton.addEventListener('click', clearChat);

		messageInput.addEventListener('input', function() {
			sendButton.disabled = !this.value.trim();
		});

		// Focus input on load
		messageInput.focus();
	</script>
</body>
</html>`;
	}
}

function disableBuiltInChat(context: vscode.ExtensionContext) {
	// Set configuration to disable built-in AI features
	const config = vscode.workspace.getConfiguration();

	// Update workspace settings to disable chat
	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Workspace, true)
		.then(() => {
			console.log('Built-in chat features disabled');
		}, (error) => {
			console.error('Failed to disable built-in chat:', error);
		});

	// Also try to disable at user level if workspace update fails
	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Global, true)
		.then(() => {
			// Successfully disabled at user level
		}, (error: unknown) => {
			console.error('Failed to disable built-in chat at user level:', error);
		});
}

// This method is called when your extension is deactivated
export function deactivate() { }
