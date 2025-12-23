import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	disableBuiltInChat();

	const provider = new CustomChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('vsctrwhCustomChat', provider)
	);

	const revealChat = () => {
		const instance = CustomChatViewProvider.getInstance();
		instance?.reveal();
	};

	context.subscriptions.push(
		vscode.commands.registerCommand('vsctrwh.openChat', revealChat),
		vscode.commands.registerCommand('workbench.action.chat.open', revealChat),
		vscode.commands.registerCommand('workbench.action.chat.openInEditor', revealChat)
	);
}

class CustomChatViewProvider implements vscode.WebviewViewProvider {
	private static instance: CustomChatViewProvider | undefined;
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {
		CustomChatViewProvider.instance = this;
	}

	public static getInstance(): CustomChatViewProvider | undefined {
		return CustomChatViewProvider.instance;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getWebviewContent(webviewView.webview);
		webviewView.show(true);

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'sendMessage':
					this.handleChatMessage(message.text);
					break;
				case 'clearChat':
					this.clearChat();
					break;
			}
		});
	}

	public reveal() {
		this._view?.show(true);
	}

	private handleChatMessage(text: string) {
		console.log('Received message:', text);
	}

	private clearChat() {
		this._view?.webview.postMessage({ command: 'clearChat' });
	}

	private getWebviewContent(webview: vscode.Webview): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Trumio Chat</title>
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
			<h2>Trumio Chat</h2>
			<button class="clear-button" id="clearButton">Clear Chat</button>
		</div>
		<div class="messages-container" id="messagesContainer">
			<div class="empty-state">
				<h3>Welcome to Trumio Chat</h3>
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

		messageInput.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 120) + 'px';
		});

		messageInput.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});

		function sendMessage() {
			const message = messageInput.value.trim();
			if (!message) return;

			addMessage('user', message);
			messageInput.value = '';
			messageInput.style.height = 'auto';
			sendButton.disabled = true;

			vscode.postMessage({
				command: 'sendMessage',
				text: message
			});

			const typingId = addMessage('assistant', 'Thinking...', true);
			
			setTimeout(() => {
				removeMessage(typingId);
				addMessage('assistant', generateResponse(message));
			}, 1000);
		}

		function addMessage(role, text, isTemporary = false) {
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
					<h3>Welcome to Trumio Chat</h3>
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

		messageInput.focus();
	</script>
</body>
</html>`;
	}
}

function disableBuiltInChat() {
	const config = vscode.workspace.getConfiguration();

	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Workspace, true)
		.then(() => {
			console.log('Built-in chat features disabled');
		}, (error) => {
			console.error('Failed to disable built-in chat:', error);
		});

	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Global, true)
		.then(() => {
			// Successfully disabled at user level
		}, (error: unknown) => {
			console.error('Failed to disable built-in chat at user level:', error);
		});
}

export function deactivate() { }
