import { useEffect, useRef } from 'react';
import type { ExtensionMessage, IDEEvent } from '../types';

declare global {
	interface Window {
		vscode: {
			postMessage: (message: {
				command: string;
				text?: string;
				data?: unknown;
				filePath?: string;
				line?: number;
			}) => void;
		};
	}
}

export function useVSCode() {
	const vscodeRef = useRef(
		window.vscode || {
			postMessage: (message: {
				command: string;
				text?: string;
				data?: unknown;
				filePath?: string;
				line?: number;
			}) => {
				console.log('vscode.postMessage called (mock):', message);
			}
		}
	);

	return vscodeRef.current;
}

export function useVSCodeMessageListener(onMessage: (message: ExtensionMessage) => void): void {
	useEffect(() => {
		const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
			onMessage(event.data);
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [onMessage]);
}

export function formatIDEEvent(event: IDEEvent): string {
	if (event.type === 'codeEdit') {
		const changeCount = event.changes.length;
		return `📝 Edited ${event.fileName} (${event.language}): ${changeCount} change${changeCount > 1 ? 's' : ''}`;
	} else if (event.type === 'codeSelection') {
		const lines = event.selection.endLine - event.selection.startLine + 1;
		const selectionText = event.selection.text.trim();

		// Get a brief quote (first line or first 60 chars)
		const firstLine = selectionText.split('\n')[0];
		const quote = firstLine.length > 60 ? firstLine.substring(0, 60).trim() + '...' : firstLine;

		const lineInfo =
			lines === 1
				? `line ${event.selection.startLine + 1}`
				: `lines ${event.selection.startLine + 1}-${event.selection.endLine + 1}`;

		return `🔍 Selected ${lineInfo} in ${event.fileName}: "${quote}"`;
	}
	return 'Unknown event';
}
