import { useState, useCallback } from 'react';
import type { Message, IDEEvent } from '../types';
import { formatIDEEvent } from './useVSCode';

export function useMessages() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isTyping, setIsTyping] = useState(false);

	const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
		const newMessage: Message = {
			...message,
			id: `msg-${Date.now()}-${Math.random()}`,
			timestamp: new Date()
		};
		setMessages(prev => [...prev, newMessage]);
		return newMessage.id;
	}, []);

	const addIDEEvent = useCallback((event: IDEEvent) => {
		const formattedText = formatIDEEvent(event);
		const metadata = event.type === 'codeEdit'
			? {
				filePath: event.filePath,
				fileName: event.fileName,
				language: event.language,
				changeType: 'edit' as const
			}
			: {
				filePath: event.filePath,
				fileName: event.fileName,
				language: event.language,
				selection: event.selection,
				changeType: 'selection' as const
			};

		addMessage({
			role: 'system',
			text: formattedText,
			metadata
		});
	}, [addMessage]);

	const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
		setMessages(prev => prev.map(msg => 
			msg.id === id ? { ...msg, ...updates } : msg
		));
	}, []);

	const removeMessage = useCallback((id: string) => {
		setMessages(prev => prev.filter(msg => msg.id !== id));
	}, []);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	return {
		messages,
		isTyping,
		setIsTyping,
		addMessage,
		addIDEEvent,
		updateMessage,
		removeMessage,
		clearMessages
	};
}

