import { CopilotChatStreamEvent, CopilotChatUserRole } from '../constraints/enums/copilot-enums';
import {
	AgentSessionDetails,
	CopilotChatMessage,
	CopilotChatReasoningStep,
	CopilotChatStreamChunk,
	ChatStateSetters,
	StreamProcessorRef,
	ProcessedChunksRef,
	InputRef
} from '../constraints/types/copilot-types';
import {
	sendMessageService,
	deleteAgentSessionService,
	createAgentSessionService,
	getAgentSessionDetailsService
} from '../services/copilot-service';
import { MessageMetadata } from '../types';
import { parseMessages } from '../utils/parsing-utils/copilot-parsing-utils';
import { createJsonStreamProcessor } from '../utils/stream-utils';

/**
 * Loads session details and parses messages
 * Returns the parsed messages array
 */
export const loadSessionMessages = async (
	sessionId: string
): Promise<{
	messages: CopilotChatMessage[];
	sessionDetails: AgentSessionDetails | null;
}> => {
	try {
		const sessionDetails = await getAgentSessionDetailsService(sessionId);
		if (!sessionDetails) return { messages: [], sessionDetails: null };
		const messages = parseMessages(sessionDetails);
		return { messages, sessionDetails };
	} catch (error) {
		console.error('Failed to load session messages:', error);
		return { messages: [], sessionDetails: null };
	}
};

/**
 * Loads session messages and updates state
 * Handles loading state, error handling, and state updates
 */
export const loadSessionWithState = async (
	sessionId: string,
	setters: {
		setMessages: React.Dispatch<React.SetStateAction<CopilotChatMessage[]>>;
		setIsSessionLoading: (loading: boolean) => void;
		setSessionId?: (sessionId: string) => void;
		setSessionDetails?: (sessionDetails: AgentSessionDetails) => void;
	}
): Promise<void> => {
	setters.setIsSessionLoading(true);
	if (setters.setSessionId) {
		setters.setSessionId(sessionId);
	}
	try {
		const { messages, sessionDetails } = await loadSessionMessages(sessionId);
		setters.setMessages(messages);
		if (setters.setSessionDetails && sessionDetails) {
			setters.setSessionDetails(sessionDetails);
		}
	} catch (error) {
		console.error('Failed to load session:', error);
	} finally {
		setters.setIsSessionLoading(false);
	}
};

/**
 * Handles streaming assistant responses
 */
export const handleAssistantStream = async (
	responseStream: ReadableStream<Uint8Array<ArrayBuffer>> | null | undefined,
	setters: ChatStateSetters,
	streamProcessorRef: StreamProcessorRef,
	processedChunksRef: ProcessedChunksRef
) => {
	if (!responseStream) return;

	// Clear processed chunks for new message
	processedChunksRef.current.clear();

	// Create filtered stream processor for RunResponse events only
	const streamProcessor = createJsonStreamProcessor(
		(newChunk: CopilotChatStreamChunk) => {
			// Create a unique identifier for this chunk
			const chunkId = `${newChunk.event}-${newChunk.content}-${Date.now()}`;

			// Check if we've already processed this chunk
			if (processedChunksRef.current.has(chunkId)) {
				return;
			}

			// Mark chunk as processed
			processedChunksRef.current.add(chunkId);
			setters.setStreamedChunks((prev) => [...prev, newChunk]);

			if (newChunk.event === CopilotChatStreamEvent.RunCompleted) {
				setters.setIsSending(false);
				setters.setMessages((prev) => [
					...prev,
					{
						role: CopilotChatUserRole.Assistant,
						content: newChunk.content as string,
						createdAt: Date.now(),
						reasoningSteps: (newChunk.extra_data?.reasoning_steps as CopilotChatReasoningStep[]) || []
					}
				]);
				return;
			}
		},
		(error) => {
			console.error('Stream processing error:', error);
			// Show error to user
			setters.setMessages((prev) => {
				const updatedMessages = [...prev];
				updatedMessages[updatedMessages.length - 1] = {
					...updatedMessages[updatedMessages.length - 1],
					content: 'Sorry, there was an error processing the response.'
				};
				return updatedMessages;
			});
		}
	);

	// Store processor reference for potential cleanup
	streamProcessorRef.current = streamProcessor;

	// Process the stream
	await streamProcessor.process(responseStream);
};

/**
 * Creates a new chat session and sends the first message
 * Uses stream: false for new chats
 * Returns the sessionId if successful, null otherwise
 */
export const createNewChatSession = async (message: string): Promise<string | null> => {
	if (!message.trim()) return null;

	try {
		const sessionId = await createAgentSessionService();
		if (!sessionId) return null;

		await sendMessageService({
			message,
			stream: false,
			sessionId
		});

		return sessionId;
	} catch (error) {
		console.error('Failed to create new chat session:', error);
		return null;
	}
};

/**
 * Sends a message and handles the response
 * Creates a session if sessionId is null/undefined
 * Uses stream: false for new chats, stream: true for existing chats
 * Returns the sessionId that was used (newly created or existing)
 */
export const sendChatMessage = async (
	message: string,
	sessionId: string | null,
	setters: ChatStateSetters,
	streamProcessorRef: StreamProcessorRef,
	processedChunksRef: ProcessedChunksRef,
	inputRef?: InputRef,
	metadata?: MessageMetadata
): Promise<string | null> => {
	if (!message.trim()) return null;

	// Create session if it doesn't exist
	const isNewChat = !sessionId;
	let finalSessionId = sessionId;

	// Add user message immediately (before creating session for new chats)
	setters.setMessages((prev) => [
		...prev,
		{
			role: CopilotChatUserRole.User,
			content: message,
			createdAt: Date.now(),
			metadata
		}
	]);

	// Abort any existing stream processing
	if (streamProcessorRef.current) {
		streamProcessorRef.current.abort();
		streamProcessorRef.current = null;
	}
	setters.setStreamedChunks([]);
	setters.setIsSending(true);
	setters.setInput('');

	try {
		if (isNewChat) {
			// For new chats, create session and send message
			finalSessionId = await createNewChatSession(message);
			if (!finalSessionId) {
				setters.setMessages((prev) => [
					...prev,
					{
						role: CopilotChatUserRole.Assistant,
						content: 'Sorry, there was an error creating a chat session. Please try again.',
						createdAt: Date.now()
					}
				]);
				setters.setIsSending(false);
				return null;
			}

			// Load the session messages to get the assistant response
			const { messages } = await loadSessionMessages(finalSessionId);
			setters.setMessages(messages);
			setters.setIsSending(false);
			return finalSessionId;
		} else {
			const formattedMessage = metadata
				? `You are a Tech Coach. Please review the following code snippet
           & provide a constructive feedback along with alternative implementations and nudges wherever possible
           to foster critical thinking in the talent.
           Please do not include any extra info like here's your feedback. Keep it minimal and to the point.
           Format the text as needed to increase the readability and user focus. Do not add too many linebreaks or spaces.
           Mention only five most important points.
           Code snippet: ${metadata.selection?.text}`
				: message;
			// For existing chats with stream: true, send the message and handle the stream
			const response = await sendMessageService({
				message: formattedMessage,
				stream: true,
				sessionId: finalSessionId!
			});

			await handleAssistantStream(
				response as ReadableStream<Uint8Array<ArrayBuffer>>,
				setters,
				streamProcessorRef,
				processedChunksRef
			);
		}
	} catch (error) {
		setters.setMessages((prev) => [
			...prev,
			{
				role: CopilotChatUserRole.Assistant,
				content: 'Sorry, there was an error sending your message. Please try again.',
				createdAt: Date.now()
			}
		]);
		setters.setIsSending(false);
	} finally {
		if (inputRef?.current) {
			inputRef.current.focus();
		}
	}

	return finalSessionId;
};

/**
 * Computes streamed message content from chunks
 */
export const getStreamedMessage = (streamedChunks: CopilotChatStreamChunk[]): string => {
	return (
		streamedChunks
			?.filter((chunk) => chunk.event === CopilotChatStreamEvent.RunResponse)
			?.map((chunk) => chunk.content)
			.join('') || ''
	);
};

/**
 * Computes streamed reasoning steps from chunks
 */
export const getStreamedReasoningSteps = (
	streamedChunks: CopilotChatStreamChunk[]
): CopilotChatReasoningStep[] => {
	return (
		streamedChunks
			?.filter((chunk) => chunk.event === CopilotChatStreamEvent.ReasoningStep)
			?.map((chunk) => chunk.content as CopilotChatReasoningStep) || []
	);
};

/**
 * Deletes a chat session
 */
export const deleteChatSession = async (
	sessionId: string,
	populateAgentSessions: () => void,
	onSuccess?: () => void
): Promise<boolean> => {
	try {
		await deleteAgentSessionService(sessionId);
		// showToastMessage(ToastType.SUCCESS, "Chat deleted successfully");
		populateAgentSessions();
		onSuccess?.();
		return true;
	} catch (error) {
		// showToastMessage(ToastType.ERROR, "Failed to delete chat");
		return false;
	}
};
