import React, { useEffect, useRef } from 'react';
import type {
	CopilotChatMessage,
	CopilotChatReasoningStep
} from '../constraints/types/copilot-types';
import { MessageItem } from './MessageItem';
import './MessageList.css';
import { CopilotChatUserRole } from '../constraints/enums/copilot-enums';

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

	console.log(streamedReasoningSteps);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

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
				<>
					<MessageItem
						message={{
							role: CopilotChatUserRole.Assistant,
							content: streamedMessage,
							createdAt: Date.now()
						}}
					/>
				</>
			)}
			<div ref={messagesEndRef} />
		</div>
	);
};
