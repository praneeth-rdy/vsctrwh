export interface MessageMetadata {
	filePath?: string;
	fileName?: string;
	parentFolder?: string;
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
	parentFolder?: string;
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

export interface ApiRequest {
	method: 'GET' | 'POST' | 'DELETE';
	url: string;
	headers?: Record<string, string>;
	body?: string;
	formData?: Array<{ name: string; value: string }>;
}

export interface WebviewMessage {
	command: string;
	text?: string;
	data?: unknown;
	filePath?: string;
	line?: number;
	apiRequest?: ApiRequest;
	requestId?: string;
	stream?: boolean;
}

export interface ExtensionMessage {
	command: string;
	event?: IDEEvent;
	text?: string;
	requestId?: string;
	success?: boolean;
	data?: {
		status: number;
		body: string;
		headers: Record<string, string | string[]>;
	};
	error?: string;
	chunk?: {
		status: number;
		headers: Record<string, string | string[]>;
		streamChunk?: string;
		streamComplete?: boolean;
		streamError?: string;
	};
}
