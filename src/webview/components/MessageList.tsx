import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { MessageItem } from './MessageItem';
import './MessageList.css';

interface MessageListProps {
	messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	if (messages.length === 0) {
		return (
			<div className="empty-state">
				<h3>Welcome to Trumio Chat</h3>
				<p>Start a conversation by typing a message below.</p>
				<p className="empty-state-hint">
					IDE events (code edits and selections) will appear here automatically.
				</p>
			</div>
		);
	}

	return (
		<div className="messages-container">
			{messages.map((message) => (
				<MessageItem key={message.id} message={message} />
			))}
			<div ref={messagesEndRef} />
		</div>
	);
};
