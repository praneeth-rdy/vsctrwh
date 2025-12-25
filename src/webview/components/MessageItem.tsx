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

	const handleFileClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (message.metadata?.filePath) {
			const line = message.metadata.selection?.startLine;
			window.vscode?.postMessage({
				command: 'openFile',
				filePath: message.metadata.filePath,
				line: line
			});
		}
	};

	const getFileDisplayName = (): string => {
		if (!message.metadata?.fileName) return '';
		if (message.metadata.parentFolder) {
			return `${message.metadata.parentFolder}/${message.metadata.fileName}`;
		}
		return message.metadata.fileName;
	};

	return (
		<div className={`message ${message.role}`}>
			<div className="message-bubble">
				{message.metadata && message.metadata.changeType === 'selection' ? (
					<>
						{/* File name at the top */}
						{message.metadata.fileName && message.metadata.filePath && (
							<div className="file-header">
								<button
									className="file-link"
									onClick={handleFileClick}
									title={`Open ${getFileDisplayName()}${message.metadata.selection ? ` at line ${message.metadata.selection.startLine + 1}` : ''}`}
								>
									📄 {getFileDisplayName()}
								</button>
								{message.metadata.language && (
									<span className="file-language">{message.metadata.language}</span>
								)}
							</div>
						)}

						{/* Code snippet */}
						{message.metadata.selection && message.metadata.selection.text && (
							<pre className="code-snippet">
								<code>{message.metadata.selection.text}</code>
							</pre>
						)}

						{/* Message text */}
						<div className="message-text">{message.text}</div>
					</>
				) : (
					message.text
				)}
			</div>
			<div className="message-time">{formatTime(message.timestamp)}</div>
		</div>
	);
};
