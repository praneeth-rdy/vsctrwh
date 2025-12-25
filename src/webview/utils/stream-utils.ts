/**
 * Utility functions for handling streaming data, particularly JSON streams
 */

import {
	CopilotChatStreamChunk,
	CopilotChatStreamProcessorOptions
} from '../constraints/types/copilot-types';

/**
 * Standard JSON stream processing with robust error handling and recovery
 */
export async function processJsonStream(
	stream: ReadableStream<Uint8Array>,
	options: CopilotChatStreamProcessorOptions
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	const maxBufferSize = options.maxBufferSize || 1024 * 1024; // 1MB default
	let isStreamActive = true;

	const cleanup = () => {
		isStreamActive = false;
		try {
			reader.releaseLock();
		} catch (error) {
			// Reader might already be released
		}
	};

	try {
		while (isStreamActive) {
			const { done, value } = await reader.read();

			if (done) {
				// Process any remaining complete JSON objects in buffer
				if (buffer.trim()) {
					const remainingBuffer = await processBuffer(buffer, options);
					// If there's still content left, it's likely incomplete JSON
					if (remainingBuffer.trim()) {
						console.warn('Incomplete JSON in final buffer:', remainingBuffer);
					}
				}
				break;
			}

			// Decode chunk and add to buffer
			const chunk = decoder.decode(value, { stream: true });
			buffer += chunk;

			// Prevent buffer overflow
			if (buffer.length > maxBufferSize) {
				const error = new Error(`Stream buffer exceeded maximum size of ${maxBufferSize} bytes`);
				options.onError?.(error);
				cleanup();
				return;
			}

			// Process complete JSON objects and update buffer
			const remainingBuffer = await processBuffer(buffer, options);
			buffer = remainingBuffer;
		}
	} catch (error) {
		console.error('Stream processing error:', error);
		options.onError?.(error as Error);
	} finally {
		cleanup();
		options.onComplete?.();
	}
}

/**
 * Processes the buffer to extract complete JSON objects
 */
async function processBuffer(
	buffer: string,
	options: CopilotChatStreamProcessorOptions
): Promise<string> {
	let processed = 0;
	let currentIndex = 0;

	while (currentIndex < buffer.length) {
		// Find next JSON object start
		const startIndex = buffer.indexOf('{', currentIndex);
		if (startIndex === -1) {
			// No more JSON objects, return remaining buffer
			return buffer.substring(processed);
		}

		// Find matching closing brace
		const endIndex = findJsonObjectEnd(buffer, startIndex);

		if (endIndex === -1) {
			// Incomplete JSON object, keep in buffer
			return buffer.substring(processed);
		}

		// Extract and parse JSON object
		const jsonString = buffer.substring(startIndex, endIndex + 1);

		// Quick validation before parsing
		if (!isValidJsonString(jsonString)) {
			console.warn('Invalid JSON structure, skipping:', jsonString);
			processed = startIndex + 1;
			currentIndex = startIndex + 1;
			continue;
		}

		try {
			const chunk = JSON.parse(jsonString);
			options.onChunk(chunk);
			processed = endIndex + 1;
			currentIndex = endIndex + 1;
		} catch (parseError) {
			console.warn('Failed to parse JSON chunk:', jsonString, parseError);
			// Skip malformed JSON and continue processing
			processed = startIndex + 1;
			currentIndex = startIndex + 1;
		}
	}

	return buffer.substring(processed);
}

/**
 * Finds the end of a JSON object by tracking braces, strings, and escapes
 */
function findJsonObjectEnd(buffer: string, startIndex: number): number {
	let braceCount = 0;
	let inString = false;
	let escape = false;

	for (let i = startIndex; i < buffer.length; i++) {
		const char = buffer[i];

		if (escape) {
			escape = false;
			continue;
		}

		if (char === '\\') {
			escape = true;
			continue;
		}

		if (char === '"') {
			inString = !inString;
			continue;
		}

		if (!inString) {
			if (char === '{') {
				braceCount++;
			} else if (char === '}') {
				braceCount--;
				if (braceCount === 0) {
					return i;
				}
			}
		}
	}

	return -1; // Incomplete JSON object
}

/**
 * Validates if a string looks like valid JSON before parsing
 */
function isValidJsonString(str: string): boolean {
	const trimmed = str.trim();
	return trimmed.startsWith('{') && trimmed.endsWith('}');
}

/**
 * Standard stream processor interface
 */
export interface StreamProcessor {
	process(stream: ReadableStream<Uint8Array>): Promise<void>;
	abort(): void;
}

/**
 * Creates a robust JSON stream processor for chat applications
 */
export function createChatStreamProcessor(
	onContent: (content: CopilotChatStreamChunk[]) => void,
	onError?: (error: Error) => void,
	onComplete?: () => void
): StreamProcessor {
	let accumulatedContent: CopilotChatStreamChunk[] = [];
	let isAborted = false;

	return {
		async process(stream: ReadableStream<Uint8Array>) {
			if (isAborted) {
				return;
			}

			try {
				await processJsonStream(stream, {
					onChunk: (chunk: CopilotChatStreamChunk) => {
						if (isAborted || !chunk) {
							return;
						}

						accumulatedContent.push(chunk);
						onContent([...accumulatedContent]); // Pass copy to prevent mutations
					},
					onError: (error) => {
						if (isAborted) {
							return;
						}
						onError?.(error);
					},
					onComplete: () => {
						if (isAborted) {
							return;
						}
						onComplete?.();
					}
				});
			} catch (error) {
				if (!isAborted) {
					onError?.(error as Error);
				}
			}
		},
		abort() {
			isAborted = true;
		}
	};
}

/**
 * Creates an incremental JSON stream processor for real-time updates
 */
export function createIncrementalChatStreamProcessor(
	onNewContent: (newContent: CopilotChatStreamChunk) => void,
	onError?: (error: Error) => void,
	onComplete?: () => void
): StreamProcessor {
	let isAborted = false;

	return {
		async process(stream: ReadableStream<Uint8Array>) {
			if (isAborted) {
				return;
			}

			try {
				await processJsonStream(stream, {
					onChunk: (chunk: CopilotChatStreamChunk) => {
						if (isAborted || !chunk) {
							return;
						}
						onNewContent(chunk);
					},
					onError: (error) => {
						if (isAborted) {
							return;
						}
						onError?.(error);
					},
					onComplete: () => {
						if (isAborted) {
							return;
						}
						onComplete?.();
					}
				});
			} catch (error) {
				if (!isAborted) {
					onError?.(error as Error);
				}
			}
		},
		abort() {
			isAborted = true;
		}
	};
}

/**
 * Creates a filtered stream processor that only processes specific event types
 */
export function createJsonStreamProcessor(
	onContent: (content: CopilotChatStreamChunk) => void,
	onError?: (error: Error) => void,
	onComplete?: () => void
): StreamProcessor {
	let isAborted = false;

	return {
		async process(stream: ReadableStream<Uint8Array>) {
			if (isAborted) {
				return;
			}

			try {
				await processJsonStream(stream, {
					onChunk: (chunk: CopilotChatStreamChunk) => {
						if (isAborted || !chunk) {
							return;
						}
						onContent(chunk);
					},
					onError: (error) => {
						if (isAborted) {
							return;
						}
						onError?.(error);
					},
					onComplete: () => {
						if (isAborted) {
							return;
						}
						onComplete?.();
					}
				});
			} catch (error) {
				if (!isAborted) {
					onError?.(error as Error);
				}
			}
		},
		abort() {
			isAborted = true;
		}
	};
}
