import React from 'react';
import type { CopilotChatMessage } from '../constraints/types/copilot-types';
import './MessageItem.css';
import { formatEpochToHumanReadable } from '../utils/date-utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageItemProps {
	message: CopilotChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
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
						<div className="message-text">{message.content}</div>
					</>
				) : (
					<Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
				)}
			</div>
			<div className="message-time">{formatEpochToHumanReadable(message.createdAt)}</div>
		</div>
	);
};
