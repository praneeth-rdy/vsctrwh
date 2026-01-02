import * as vscode from 'vscode';
import type { CodeSelectionEvent } from '../webview/types';

export class AddToChatProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	private _pendingSelection:
		| {
				document: vscode.TextDocument;
				range: vscode.Range;
				selectionEvent: CodeSelectionEvent;
		  }
		| undefined;

	public setSelection(
		document: vscode.TextDocument,
		range: vscode.Range,
		selectionEvent: CodeSelectionEvent
	): void {
		this._pendingSelection = { document, range, selectionEvent };
		this._onDidChangeCodeLenses.fire();
	}

	public clearSelection(): void {
		this._pendingSelection = undefined;
		this._onDidChangeCodeLenses.fire();
	}

	public provideCodeLenses(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		if (
			!this._pendingSelection ||
			this._pendingSelection.document.uri.toString() !== document.uri.toString()
		) {
			return [];
		}

		const { range, selectionEvent } = this._pendingSelection;
		const lensRange = new vscode.Range(range.start.line, 0, range.start.line, 0);

		const codeLens = new vscode.CodeLens(lensRange, {
			title: '✨ Analyse with Mio',
			command: 'vsctrwh.analyseWithMio',
			arguments: [selectionEvent],
			tooltip: 'Click to analyse selected code with Mio'
		});

		return [codeLens];
	}

	public resolveCodeLens(
		codeLens: vscode.CodeLens,
		_token: vscode.CancellationToken
	): vscode.CodeLens {
		return codeLens;
	}
}
