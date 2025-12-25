import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare function acquireVsCodeApi(): {
	postMessage: (message: { command: string; text?: string; data?: unknown }) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

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

const vscodeApi = acquireVsCodeApi();
window.vscode = {
	postMessage: vscodeApi.postMessage
};

const container = document.getElementById('root');
if (!container) {
	console.error('Root container not found!');
} else {
	console.log('Initializing React app...');
	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
	console.log('React app initialized');
}
