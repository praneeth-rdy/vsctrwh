// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

let chatPanel: vscode.WebviewPanel | undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Disable VS Code's built-in chat features
	disableBuiltInChat(context);

	// Register command to open custom chat
	const openChatDisposable = vscode.commands.registerCommand('vsctrwh.openChat', () => {
		createOrShowChatPanel(context);
	});

	// Register command to close chat
	const closeChatDisposable = vscode.commands.registerCommand('vsctrwh.closeChat', () => {
		if (chatPanel) {
			chatPanel.dispose();
		}
	});

	// Override built-in chat commands to show our custom chat instead
	const overrideChatDisposable = vscode.commands.registerCommand('workbench.action.chat.open', () => {
		createOrShowChatPanel(context);
	});

	const overrideInlineChatDisposable = vscode.commands.registerCommand('workbench.action.chat.openInEditor', () => {
		createOrShowChatPanel(context);
	});

	context.subscriptions.push(
		openChatDisposable,
		closeChatDisposable,
		overrideChatDisposable,
		overrideInlineChatDisposable
	);

	console.log('Custom Chat Extension "vsctrwh" is now active!');
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

function createOrShowChatPanel(context: vscode.ExtensionContext) {
	// Always open in the right panel (beside the active editor)
	const columnToShowIn = vscode.ViewColumn.Beside;

	if (chatPanel) {
		// If we already have a panel, show it in the right column
		chatPanel.reveal(columnToShowIn);
		return;
	}

	// Otherwise, create a new panel in the right column
	chatPanel = vscode.window.createWebviewPanel(
		'customChat',
		'Custom Chat',
		columnToShowIn,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src'))]
		}
	);

	// Set the webview's initial html content
	chatPanel.webview.html = getWebviewContent(chatPanel.webview, context);

	// Handle messages from the webview
	chatPanel.webview.onDidReceiveMessage(
		message => {
			switch (message.command) {
				case 'sendMessage':
					handleChatMessage(message.text);
					return;
				case 'clearChat':
					clearChat();
					return;
			}
		},
		undefined,
		context.subscriptions
	);

	// Handle panel disposal
	chatPanel.onDidDispose(
		() => {
			chatPanel = undefined;
		},
		null,
		context.subscriptions
	);
}

function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
	// Get the path to the HTML file
	const htmlPath = path.join(context.extensionPath, 'src', 'chat.html');

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
				placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
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

function handleChatMessage(text: string) {
	// Handle the chat message here
	// You can integrate with any chat API or service
	console.log('Received message:', text);

	// Example: You could call an API here
	// For now, the webview handles the response simulation
}

function clearChat() {
	if (chatPanel) {
		chatPanel.webview.postMessage({ command: 'clearChat' });
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (chatPanel) {
		chatPanel.dispose();
	}
}
