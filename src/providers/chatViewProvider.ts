import * as vscode from 'vscode';
import { getWebviewContent } from '../webview/chatWebview';
import type { ExtensionMessage, IDEEvent, CodeEditEvent, CodeSelectionEvent } from '../webview/types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	private static instance: ChatViewProvider | undefined;
	private _view?: vscode.WebviewView;
	private _disposables: vscode.Disposable[] = [];

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
		this.setupIDEEventListeners();
	}

	public reveal(): void {
		this._view?.show(true);
	}

	public dispose(): void {
		this._disposables.forEach(disposable => disposable.dispose());
		this._disposables = [];
	}

	private setupMessageHandlers(webviewView: vscode.WebviewView): void {
		const messageHandler = webviewView.webview.onDidReceiveMessage((message: { command: string; text?: string }) => {
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
		this._disposables.push(messageHandler);
	}

	private setupIDEEventListeners(): void {
		// Listen to text document changes (code edits)
		const textDocumentChangeListener = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
			if (!this._view) return;

			const document = event.document;
			if (document.uri.scheme === 'file' && event.contentChanges.length > 0) {
				const editEvent: CodeEditEvent = {
					type: 'codeEdit',
					filePath: document.uri.fsPath,
					fileName: document.fileName.split('/').pop() || document.fileName,
					language: document.languageId,
					changes: event.contentChanges.map(change => ({
						range: {
							startLine: change.range.start.line,
							endLine: change.range.end.line,
							startCharacter: change.range.start.character,
							endCharacter: change.range.end.character
						},
						text: change.text
					}))
				};

				this.sendIDEEvent(editEvent);
			}
		});
		this._disposables.push(textDocumentChangeListener);

		// Listen to text editor selection changes
		const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection((event: vscode.TextEditorSelectionChangeEvent) => {
			if (!this._view) return;

			const editor = event.textEditor;
			const document = editor.document;
			const selection = event.selections[0];

			if (document.uri.scheme === 'file' && selection && !selection.isEmpty) {
				const selectedText = document.getText(selection);
				const selectionEvent: CodeSelectionEvent = {
					type: 'codeSelection',
					filePath: document.uri.fsPath,
					fileName: document.fileName.split('/').pop() || document.fileName,
					language: document.languageId,
					selection: {
						startLine: selection.start.line,
						endLine: selection.end.line,
						startCharacter: selection.start.character,
						endCharacter: selection.end.character,
						text: selectedText
					}
				};

				this.sendIDEEvent(selectionEvent);
			}
		});
		this._disposables.push(selectionChangeListener);
	}

	private sendIDEEvent(event: IDEEvent): void {
		if (!this._view) return;

		const message: ExtensionMessage = {
			command: 'ideEvent',
			event
		};

		this._view.webview.postMessage(message);
	}

	private handleChatMessage(text: string): void {
		console.log('Received message:', text);
	}

	private clearChat(): void {
		this._view?.webview.postMessage({ command: 'clearChat' });
	}
}

