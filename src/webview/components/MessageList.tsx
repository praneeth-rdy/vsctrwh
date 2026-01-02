import React, { useEffect, useRef } from 'react';
import type {
	CopilotChatMessage,
	CopilotChatReasoningStep
} from '../constraints/types/copilot-types';
import { MessageItem } from './MessageItem';
import './MessageList.css';
import '../styles/markdown-styles.css';
import { CopilotChatUserRole } from '../constraints/enums/copilot-enums';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
	isTyping: boolean;
	streamedMessage: string;
	streamedReasoningSteps: CopilotChatReasoningStep[];
	messages: CopilotChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({
	isTyping,
	streamedMessage,
	streamedReasoningSteps,
	messages
}) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, isTyping, streamedMessage]);

	if (messages.length === 0) {
		return (
			<div className="empty-state">
				<h3>Welcome to Mio Buddy</h3>
				<p>Start a conversation by typing a message below.</p>
				<p className="empty-state-hint">Select your code snippet to view insights here.</p>
			</div>
		);
	}

	return (
		<div className="messages-container">
			{messages.map((message) => (
				<MessageItem key={message.createdAt} message={message} />
			))}
			{isTyping && (
				<div className="message assistant">
					<div className="message-bubble typing-indicator">
						{streamedMessage ? (
							<div className="custom-markdown">
								<Markdown remarkPlugins={[remarkGfm]}>{streamedMessage}</Markdown>
								<span className="typing-cursor">▋</span>
							</div>
						) : (
							<div className="typing-dots">
								<span></span>
								<span></span>
								<span></span>
							</div>
						)}
					</div>
					<div className="message-time">Generating...</div>
				</div>
			)}
			<div ref={messagesEndRef} />
		</div>
	);
};
