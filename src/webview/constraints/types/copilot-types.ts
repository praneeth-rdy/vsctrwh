import { createJsonStreamProcessor } from '../../utils/stream-utils';
import { CopilotChatStreamEvent, CopilotChatUserRole } from '../enums/copilot-enums';

export type AgentSession = {
	title: string;
	sessionId: string;
	createdAt: number;
};

export type CopilotState = {
	agentSessions: AgentSession[];
	isAgentSessionsLoading: boolean;
	isNewChatLoading: boolean;
};

export type CopilotActions = {
	populateAgentSessions: () => void;
	setIsNewChatLoading: (isNewChatLoading: boolean) => void;
	resetStore: () => void;
};

export type CopilotStore = CopilotState & CopilotActions;

export type AgentSessionDetails = {
	sessionId: string;
	agentData: {
		name: string;
		model: {
			id: string;
			name: string;
			provider: string;
			maxTokens: number;
			temperature: number;
		};
		agentId: string;
	};
	runs: {
		message: {
			role: string;
			content: string;
			createdAt: number;
		};
		response: {
			event: string;
			runId: string;
			content: string;
			createdAt: number;
			reasoningSteps?: CopilotChatReasoningStep[];
		};
	}[];
};

export type CopilotChatReasoningStep = {
	title: string;
	reasoning: string;
	confidence: number;
	action?: string;
	result?: string;
};

export type CopilotChatMessage = {
	role: CopilotChatUserRole;
	content: string;
	createdAt: number;
	reasoningSteps?: CopilotChatReasoningStep[];
};

export type CopilotChatStreamChunk = {
	event: CopilotChatStreamEvent;
	content?: string | CopilotChatReasoningStep;
	extra_data?: {
		reasoning_steps?: CopilotChatReasoningStep[];
	};
	[key: string]: any;
};

export type CopilotChatStreamProcessorOptions = {
	onChunk: (chunk: CopilotChatStreamChunk) => void;
	onError?: (error: Error) => void;
	onComplete?: () => void;
	maxBufferSize?: number; // Prevent memory issues with very large streams
};

export type ChatStateSetters = {
	setMessages: React.Dispatch<React.SetStateAction<CopilotChatMessage[]>>;
	setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
	setStreamedChunks: React.Dispatch<React.SetStateAction<CopilotChatStreamChunk[]>>;
	setInput: React.Dispatch<React.SetStateAction<string>>;
};

export type StreamProcessorRef = {
	current: ReturnType<typeof createJsonStreamProcessor> | null;
};

export type ProcessedChunksRef = {
	current: Set<string>;
};

export type InputRef = React.RefObject<HTMLInputElement | null>;

export type ChatComponentProps = {
	sessionId: string | null;
	messages: CopilotChatMessage[];
	setMessages: React.Dispatch<React.SetStateAction<CopilotChatMessage[]>>;
	className?: string;
	inputPlaceholder?: string;
	showHeader?: boolean;
	headerContent?: React.ReactNode;
	onSessionCreated?: (sessionId: string) => void;
};
