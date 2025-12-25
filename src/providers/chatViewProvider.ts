import * as vscode from 'vscode';
import { getWebviewContent } from '../webview/chatWebview';
import type { ExtensionMessage, IDEEvent, CodeSelectionEvent } from '../webview/types';
import { DEBOUNCE_DELAY_MS } from '../constants';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	private static instance: ChatViewProvider | undefined;
	private _view?: vscode.WebviewView;
	private _disposables: vscode.Disposable[] = [];
	private _selectionDebounceTimer: NodeJS.Timeout | undefined;

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
			localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview')]
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
		if (this._selectionDebounceTimer) {
			clearTimeout(this._selectionDebounceTimer);
		}
		this._disposables.forEach((disposable) => disposable.dispose());
		this._disposables = [];
	}

	private setupMessageHandlers(webviewView: vscode.WebviewView): void {
		const messageHandler = webviewView.webview.onDidReceiveMessage(
			(message: { command: string; text?: string; filePath?: string; line?: number }) => {
				switch (message.command) {
					case 'sendMessage':
						if (message.text) {
							this.handleChatMessage(message.text);
						}
						break;
					case 'clearChat':
						this.clearChat();
						break;
					case 'openFile':
						if (message.filePath !== undefined) {
							this.openFile(message.filePath, message.line);
						}
						break;
				}
			}
		);
		this._disposables.push(messageHandler);
	}

	private setupIDEEventListeners(): void {
		// Only listen to text editor selection changes (code edits removed)
		const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection(
			(event: vscode.TextEditorSelectionChangeEvent) => {
				if (!this._view) {
					return;
				}

				const editor = event.textEditor;
				const document = editor.document;
				const selection = event.selections[0];

				if (document.uri.scheme === 'file' && selection && !selection.isEmpty) {
					// Clear existing debounce timer
					if (this._selectionDebounceTimer) {
						clearTimeout(this._selectionDebounceTimer);
					}

					// Set new debounce timer
					this._selectionDebounceTimer = setTimeout(() => {
						const selectedText = document.getText(selection);
						const filePathParts = document.fileName.split('/');
						const fileName = filePathParts.pop() || document.fileName;
						const parentFolder =
							filePathParts.length > 0 ? filePathParts[filePathParts.length - 1] : undefined;

						const selectionEvent: CodeSelectionEvent = {
							type: 'codeSelection',
							filePath: document.uri.fsPath,
							fileName: fileName,
							parentFolder: parentFolder,
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
					}, DEBOUNCE_DELAY_MS);
				}
			}
		);
		this._disposables.push(selectionChangeListener);
	}

	private sendIDEEvent(event: IDEEvent): void {
		if (!this._view) {
			return;
		}

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

	private async openFile(filePath: string, line?: number): Promise<void> {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document);

			if (line !== undefined) {
				const position = new vscode.Position(line, 0);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
			}
		} catch (error) {
			console.error('Failed to open file:', error);
		}
	}
}
