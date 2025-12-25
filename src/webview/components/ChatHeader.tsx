import React from 'react';
import './ChatHeader.css';

interface ChatHeaderProps {
	onClear: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClear }) => {
	return (
		<div className="chat-header">
			<h2>Mio Buddy</h2>
			<button className="clear-button" onClick={onClear}>
				Clear Chat
			</button>
		</div>
	);
};
