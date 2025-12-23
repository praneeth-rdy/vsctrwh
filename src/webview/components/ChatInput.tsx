import React, { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
	const [inputValue, setInputValue] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
		}
	}, [inputValue]);

	const handleSend = () => {
		const message = inputValue.trim();
		if (!message || disabled) return;

		onSend(message);
		setInputValue('');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="input-container">
			<textarea
				ref={textareaRef}
				className="input-field"
				placeholder="Type your message here.."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				rows={1}
				disabled={disabled}
			/>
			<button
				className="send-button"
				onClick={handleSend}
				disabled={!inputValue.trim() || disabled}
			>
				Send
			</button>
		</div>
	);
};

