import React, { useCallback, useRef, useState } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { useVSCode, useVSCodeMessageListener } from './hooks/useVSCode';
import { useMessages } from './hooks/useMessages';
import type { ExtensionMessage, MessageMetadata } from './types';
import './App.css';
import { CODER_WORKSPACE_ID, NODE_ENV } from './utils/env';
import { NodeEnv } from './constraints/enums/core-enums';
import { isEmpty } from 'lodash';
import { CopilotChatUserRole } from './constraints/enums/copilot-enums';
import { sendMessageService } from './services/copilot-service';
import {
	getStreamedMessage,
	getStreamedReasoningSteps,
	sendChatMessage
} from './utils/copilot-chat-utils';
import {
	ChatStateSetters,
	CopilotChatStreamChunk,
	ProcessedChunksRef,
	StreamProcessorRef
} from './constraints/types/copilot-types';

function App() {
	const vscode = useVSCode();
	const { messages, isTyping, setIsTyping, clearMessages, setMessages } = useMessages();

	const [input, setInput] = useState('');
	const [streamedChunks, setStreamedChunks] = useState<CopilotChatStreamChunk[]>([]);

	const inputRef = useRef<HTMLInputElement | null>(null);
	const streamProcessorRef: StreamProcessorRef = useRef(null);
	const processedChunksRef: ProcessedChunksRef = useRef(new Set());

	const streamedMessage = getStreamedMessage(streamedChunks);
	const streamedReasoningSteps = getStreamedReasoningSteps(streamedChunks);

	// Handle messages from extension
	useVSCodeMessageListener(
		useCallback(
			(message: ExtensionMessage) => {
				switch (message.command) {
					case 'ideEvent':
						if (message.event && message.event.type === 'codeSelection') {
							const event = message.event;
							const lineInfo =
								event.selection.endLine === event.selection.startLine
									? `Line ${event.selection.startLine + 1}`
									: `Lines ${event.selection.startLine + 1}-${event.selection.endLine + 1}`;

							const formattedText = `🔍 Code selection: ${lineInfo}`;

							const metadata = {
								filePath: event.filePath,
								fileName: event.fileName,
								parentFolder: event.parentFolder,
								language: event.language,
								selection: event.selection,
								changeType: 'selection' as const
							};
							handleSend(formattedText, metadata);
						}
						break;
					case 'clearChat':
						clearMessages();
						break;
				}
			},
			[clearMessages]
		)
	);

	const setters: ChatStateSetters = {
		setMessages,
		setIsSending: setIsTyping,
		setStreamedChunks,
		setInput
	};

	const handleSend = useCallback(
		async (text: string, metadata?: MessageMetadata) => {
			if (!text.trim() || isTyping) return;

			// Send to extension
			vscode.postMessage({ command: 'sendMessage', text: text.trim() });

			// Show typing indicator
			setIsTyping(true);

			// Simulate response (replace with actual API call)
			await sendChatMessage(
				text.trim(),
				CODER_WORKSPACE_ID,
				setters,
				streamProcessorRef,
				processedChunksRef,
				inputRef,
				metadata
			);
		},
		[isTyping, setIsTyping, vscode, setters, streamProcessorRef, processedChunksRef, inputRef]
	);

	const handleClear = useCallback(() => {
		clearMessages();
		vscode.postMessage({ command: 'clearChat' });
	}, [clearMessages, vscode]);

	const isEnvProduction = NODE_ENV === NodeEnv.PRODUCTION;

	if (isEnvProduction && isEmpty(CODER_WORKSPACE_ID)) {
		return <div>Error: Workspace ID is not set</div>;
	}

	return (
		<div className="chat-container">
			<ChatHeader onClear={handleClear} />
			<MessageList
				isTyping={isTyping}
				streamedMessage={streamedMessage}
				streamedReasoningSteps={streamedReasoningSteps}
				messages={messages}
			/>
			<ChatInput inputRef={inputRef} onSend={handleSend} disabled={isTyping} />
		</div>
	);
}

export default App;
