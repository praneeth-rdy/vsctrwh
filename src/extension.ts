import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chatViewProvider';
import { disableBuiltInChat } from './utils/chatConfig';
import { COMMANDS, VIEW_IDS } from './constants';

export function activate(context: vscode.ExtensionContext): void {
	disableBuiltInChat();

	const provider = new ChatViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(VIEW_IDS.CHAT_VIEW, provider),
		provider
	);

	registerCommands(context, provider);
}

function registerCommands(
	context: vscode.ExtensionContext,
	provider: ChatViewProvider
): void {
	const revealChat = () => provider.reveal();

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.OPEN_CHAT, revealChat),
		vscode.commands.registerCommand(COMMANDS.CHAT_OPEN, revealChat),
		vscode.commands.registerCommand(COMMANDS.CHAT_OPEN_IN_EDITOR, revealChat)
	);
}

export function deactivate(): void { }
