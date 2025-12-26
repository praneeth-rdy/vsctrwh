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

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		isTyping,
		setIsTyping,
		addMessage,
		clearMessages,
		setMessages
	};
}
