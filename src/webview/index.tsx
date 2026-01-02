import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Initialize API client early to set up message listeners
import './services/api-client';
import type { WebviewMessage } from './types';

declare function acquireVsCodeApi(): {
	postMessage: (message: WebviewMessage) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

declare global {
	interface Window {
		vscode: {
			postMessage: (message: WebviewMessage) => void;
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
	// console.log('Initializing React app...');
	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
	// console.log('React app initialized');
}
