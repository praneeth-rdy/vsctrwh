import { useState, useCallback } from 'react';
import type { CodeSelectionEvent } from '../types';
import { formatIDEEvent } from './useVSCode';
import { CopilotChatMessage } from '../constraints/types/copilot-types';
import { CopilotChatUserRole } from '../constraints/enums/copilot-enums';

export function useMessages() {
	const [messages, setMessages] = useState<CopilotChatMessage[]>([]);
	const [isTyping, setIsTyping] = useState(false);

	const addMessage = useCallback((message: Omit<CopilotChatMessage, 'id' | 'timestamp'>) => {
		setMessages((prev) => [...prev, message]);
	}, []);

	const addIDEEvent = useCallback(
		(event: CodeSelectionEvent) => {
			// Only handle code selection events
			if (event.type !== 'codeSelection') {
				return;
			}

			// Simple text for the message (code snippet will be shown separately)
			const lineInfo =
				event.selection.endLine === event.selection.startLine
					? `Line ${event.selection.startLine + 1}`
					: `Lines ${event.selection.startLine + 1}-${event.selection.endLine + 1}`;

			const formattedText = `🔍 Code selection: ${lineInfo}`;
			console.log(event);

			const metadata = {
				filePath: event.filePath,
				fileName: event.fileName,
				parentFolder: event.parentFolder,
				language: event.language,
				selection: event.selection,
				changeType: 'selection' as const
			};

			addMessage({
				role: CopilotChatUserRole.User,
				content: formattedText,
				createdAt: Date.now(),
				metadata
			});
		},
		[addMessage]
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		isTyping,
		setIsTyping,
		addMessage,
		addIDEEvent,
		clearMessages,
		setMessages
	};
}
