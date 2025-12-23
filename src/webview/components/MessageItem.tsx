import React from 'react';
import type { Message } from '../types';
import './MessageItem.css';

interface MessageItemProps {
	message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
	const formatTime = (date: Date): string => {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className={`message ${message.role}`}>
			<div className="message-bubble">
				{message.text}
				{message.metadata && (
					<div className="message-metadata">
						{message.metadata.fileName && (
							<span className="metadata-item">
								📄 {message.metadata.fileName}
							</span>
						)}
						{message.metadata.language && (
							<span className="metadata-item">
								{message.metadata.language}
							</span>
						)}
					</div>
				)}
			</div>
			<div className="message-time">
				{formatTime(message.timestamp)}
			</div>
		</div>
	);
};

