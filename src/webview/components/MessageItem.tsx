import React from 'react';
import type { CopilotChatMessage } from '../constraints/types/copilot-types';
import './MessageItem.css';
import '../styles/markdown-styles.css';
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

	const hasSelectionMetadata = message.metadata && message.metadata.changeType === 'selection';
	const metadata = message.metadata;

	return (
		<div className={`message ${message.role} ${hasSelectionMetadata ? 'has-selection' : ''}`}>
			<div className={`message-bubble ${hasSelectionMetadata ? 'selection-bubble' : ''}`}>
				{hasSelectionMetadata && metadata ? (
					<>
						{/* File name at the top */}
						{metadata.fileName && metadata.filePath && (
							<div className="file-header">
								<button
									className="file-link"
									onClick={handleFileClick}
									title={`Open ${getFileDisplayName()}${metadata.selection ? ` at line ${metadata.selection.startLine + 1}` : ''}`}
								>
									<span className="file-icon">📄</span>
									<span className="file-name">{getFileDisplayName()}</span>
									{metadata.selection && (
										<span className="file-location">
											Lines {metadata.selection.startLine + 1}
											{metadata.selection.endLine !== metadata.selection.startLine &&
												`-${metadata.selection.endLine + 1}`}
										</span>
									)}
								</button>
								{metadata.language && <span className="file-language">{metadata.language}</span>}
							</div>
						)}

						{/* Code snippet */}
						{metadata.selection && metadata.selection.text && (
							<pre className="code-snippet">
								<code>{metadata.selection.text}</code>
							</pre>
						)}

						{/* Message text */}
						{message.content && <div className="message-text">{message.content}</div>}
					</>
				) : (
					<div className="custom-markdown">
						<Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
					</div>
				)}
			</div>
			<div className="message-time">{formatEpochToHumanReadable(message.createdAt)}</div>
		</div>
	);
};
