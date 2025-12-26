import React, { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

interface ChatInputProps {
	inputRef: React.RefObject<HTMLInputElement | null>;
	onSend: (message: string) => void;
	disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ inputRef, onSend, disabled = false }) => {
	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = 'auto';
			inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
		}
	}, [inputValue]);

	const handleSend = () => {
		const message = inputValue.trim();
		if (!message || disabled) return;

		onSend(message);
		setInputValue('');
	};

	return (
		<div className="input-container">
			<input
				ref={inputRef}
				className="input-field"
				placeholder="Type your message here.."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				disabled={disabled}
			/>
			<button className="send-button" onClick={handleSend} disabled={!inputValue.trim() || disabled}>
				Send
			</button>
		</div>
	);
};
