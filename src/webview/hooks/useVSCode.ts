import { useEffect, useRef } from 'react';
import type { ExtensionMessage, IDEEvent } from '../types';

declare global {
	interface Window {
		vscode: {
			postMessage: (message: { command: string; text?: string; data?: unknown }) => void;
		};
	}
}

export function useVSCode() {
	const vscodeRef = useRef(window.vscode || {
		postMessage: (message: { command: string; text?: string; data?: unknown }) => {
			console.log('vscode.postMessage called (mock):', message);
		}
	});

	return vscodeRef.current;
}

export function useVSCodeMessageListener(
	onMessage: (message: ExtensionMessage) => void
): void {
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
		const preview = event.selection.text.substring(0, 50);
		return `🔍 Selected in ${event.fileName} (${event.language}): ${lines} line${lines > 1 ? 's' : ''} - "${preview}${event.selection.text.length > 50 ? '...' : ''}"`;
	}
	return 'Unknown event';
}

