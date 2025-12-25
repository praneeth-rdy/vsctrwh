import { AgentSessionDetails, CopilotChatMessage } from '../../constraints/types/copilot-types';
import { CopilotChatUserRole } from '../../constraints/enums/copilot-enums';

export const parseAgentSessions = (data: any) => {
	return data.map((session: any) => ({
		title: session.title ?? 'Untitled',
		sessionId: session.session_id,
		createdAt: session.created_at
	}));
};

export const parseAgentSessionDetails = (data: any) => {
	return {
		sessionId: data.session_id,
		agentData: {
			name: data.agent_data?.name,
			model: {
				id: data.agent_data?.model?.id,
				name: data.agent_data?.model?.name,
				provider: data.agent_data?.model?.provider,
				maxTokens: data.agent_data?.model?.max_tokens,
				temperature: data.agent_data?.model?.temperature
			},
			agentId: data.agent_data?.agent_id
		},
		runs: data.runs?.map((run: any) => ({
			message: {
				role: run.message?.role,
				content: run.message?.content,
				createdAt: run.message?.created_at
			},
			response: {
				event: run.response?.event,
				runId: run.response?.run_id,
				content: run.response?.content,
				createdAt: run.response?.created_at,
				reasoningSteps: run.response?.extra_data?.reasoning_steps?.map((step: any) => ({
					title: step.title,
					reasoning: step.reasoning,
					confidence: step.confidence,
					action: step.action,
					result: step.result
				}))
			}
		}))
	};
};

export const parseMessages = (agentSessionDetails?: AgentSessionDetails) => {
	if (!agentSessionDetails) {
		return [];
	}
	let parsedMessages: CopilotChatMessage[] = [];
	for (const run of agentSessionDetails.runs) {
		parsedMessages.push({
			role: CopilotChatUserRole.User,
			content: run.message.content,
			createdAt: run.message.createdAt
		});
		parsedMessages.push({
			role: CopilotChatUserRole.Assistant,
			content: run.response.content,
			createdAt: run.response.createdAt,
			reasoningSteps: run.response.reasoningSteps
		});
	}
	return parsedMessages;
};
