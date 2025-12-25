import * as vscode from 'vscode';

export function disableBuiltInChat(): void {
	const config = vscode.workspace.getConfiguration();

	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Workspace, true).then(
		() => {
			console.log('Built-in chat features disabled');
		},
		(error: unknown) => {
			console.error('Failed to disable built-in chat:', error);
		}
	);

	config.update('chat.disableAIFeatures', true, vscode.ConfigurationTarget.Global, true).then(
		() => {
			// Successfully disabled at user level
		},
		(error: unknown) => {
			console.error('Failed to disable built-in chat at user level:', error);
		}
	);
}
