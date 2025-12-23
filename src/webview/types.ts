export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	text: string;
	timestamp: Date;
	metadata?: MessageMetadata;
}

export interface MessageMetadata {
	filePath?: string;
	fileName?: string;
	language?: string;
	selection?: {
		startLine: number;
		endLine: number;
		startCharacter: number;
		endCharacter: number;
		text: string;
	};
	changeType?: 'edit' | 'selection';
}

export interface CodeEditEvent {
	type: 'codeEdit';
	filePath: string;
	fileName: string;
	language: string;
	changes: Array<{
		range: {
			startLine: number;
			endLine: number;
			startCharacter: number;
			endCharacter: number;
		};
		text: string;
	}>;
}

export interface CodeSelectionEvent {
	type: 'codeSelection';
	filePath: string;
	fileName: string;
	language: string;
	selection: {
		startLine: number;
		endLine: number;
		startCharacter: number;
		endCharacter: number;
		text: string;
	};
}

export type IDEEvent = CodeEditEvent | CodeSelectionEvent;

export interface WebviewMessage {
	command: string;
	text?: string;
	data?: unknown;
}

export interface ExtensionMessage {
	command: string;
	event?: IDEEvent;
	text?: string;
}

