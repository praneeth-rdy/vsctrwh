import * as vscode from 'vscode';
import { getWebviewContent } from '../webview/chatWebview';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	private static instance: ChatViewProvider | undefined;
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {
		ChatViewProvider.instance = this;
	}

	public static getInstance(): ChatViewProvider | undefined {
		return ChatViewProvider.instance;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview')
			]
		};

		webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);
		webviewView.show(true);

		this.setupMessageHandlers(webviewView);
	}

	public reveal(): void {
		this._view?.show(true);
	}

	private setupMessageHandlers(webviewView: vscode.WebviewView): void {
		webviewView.webview.onDidReceiveMessage((message: { command: string; text?: string }) => {
			switch (message.command) {
				case 'sendMessage':
					if (message.text) {
						this.handleChatMessage(message.text);
					}
					break;
				case 'clearChat':
					this.clearChat();
					break;
			}
		});
	}

	private handleChatMessage(text: string): void {
		console.log('Received message:', text);
	}

	private clearChat(): void {
		this._view?.webview.postMessage({ command: 'clearChat' });
	}
}

