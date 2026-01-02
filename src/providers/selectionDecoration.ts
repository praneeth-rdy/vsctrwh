import * as vscode from 'vscode';
import type { CodeSelectionEvent } from '../webview/types';

export class SelectionDecoration {
	private _decorationType: vscode.TextEditorDecorationType | undefined;
	private _currentSelection:
		| {
				document: vscode.TextDocument;
				range: vscode.Range;
				selectionEvent: CodeSelectionEvent;
		  }
		| undefined;

	constructor() {
		// Create a subtle decoration to highlight the selection is ready for analysis
		this._decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.selectionBackground'),
			border: '1px dashed',
			borderColor: new vscode.ThemeColor('editor.selectionHighlightBorder'),
			borderRadius: '3px',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});
	}

	public setSelection(
		document: vscode.TextDocument,
		range: vscode.Range,
		selectionEvent: CodeSelectionEvent
	): void {
		this._currentSelection = { document, range, selectionEvent };
		this.updateDecorations();
	}

	public clearSelection(): void {
		this._currentSelection = undefined;
		this.updateDecorations();
	}

	private updateDecorations(): void {
		const editor = vscode.window.activeTextEditor;
		if (!editor || !this._decorationType) {
			return;
		}

		if (
			this._currentSelection &&
			editor.document.uri.toString() === this._currentSelection.document.uri.toString()
		) {
			editor.setDecorations(this._decorationType, [this._currentSelection.range]);
		} else {
			editor.setDecorations(this._decorationType, []);
		}
	}

	public dispose(): void {
		this._decorationType?.dispose();
	}
}
