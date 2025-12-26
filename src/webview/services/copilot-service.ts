import { routes } from '../utils/api';
import { handleError } from '../utils/error-utils';
import { apiClient } from './api-client';
import {
	parseAgentSessions,
	parseAgentSessionDetails
} from '../utils/parsing-utils/copilot-parsing-utils';
import { DEFAULT_COPILOT_AGENT_ID, TALENT_COPILOT_AGENT_ID } from '../../constants';
// import { agentSessions } from "@/mocks/copilot-mocks";

/**
 * Fetches the agent sessions from the API.
 * @returns A Promise that resolves to the agent sessions.
 */
export const getAgentSessionsService = async () => {
	const agentId = TALENT_COPILOT_AGENT_ID;
	const config = { withCredentials: true };
	try {
		const response = await apiClient.get(routes.agents.getAgentSessions(agentId), config);
		return parseAgentSessions(response.data);
		// return parseAgentSessions(agentSessions);
	} catch (error) {
		handleError(error as Error, 'An unexpected error occurred while fetching agent sessions');
	}
};

export const getAgentSessionDetailsService = async (sessionId: string) => {
	const agentId = TALENT_COPILOT_AGENT_ID;

	const config = { withCredentials: true };
	try {
		const response = await apiClient.get(
			routes.agents.getAgentSessionDetails(sessionId, agentId),
			config
		);
		return parseAgentSessionDetails(response.data);
	} catch (error) {
		handleError(error as Error, 'An unexpected error occurred while fetching agent session details');
	}
};

export const sendMessageService = async (payload: {
	message: string;
	stream: boolean;
	sessionId: string;
}) => {
	const agentId = TALENT_COPILOT_AGENT_ID;

	const formData = new FormData();
	formData.append('message', payload.message);
	formData.append('stream', String(payload.stream));
	if (payload.sessionId) {
		formData.append('session_id', payload.sessionId);
	}

	const config: RequestInit = {
		method: 'POST',
		body: formData
	};

	try {
		const response = await apiClient.fetch(routes.agents.runAgent(agentId), config);

		if (!response.ok) {
			throw new Error('Failed to send message');
		}
		return payload.stream ? response.body : (await response.json()).session_id;
	} catch (error) {
		handleError(error as Error, 'An unexpected error occurred while sending message');
	}
};

export const deleteAgentSessionService = async (sessionId: string) => {
	const agentId = TALENT_COPILOT_AGENT_ID;
	const config = { withCredentials: true };
	try {
		const response = await apiClient.delete(
			routes.agents.deleteAgentSession(sessionId, agentId),
			config
		);
		return response.data;
	} catch (error) {
		handleError(error as Error, 'An unexpected error occurred while deleting agent session');
	}
};

export const createAgentSessionService = async () => {
	const config = { withCredentials: true };
	try {
		const response = await apiClient.post(routes.agents.createSessionID(), undefined, config);
		return response.data.session_id;
	} catch (error) {
		handleError(error as Error, 'An unexpected error occurred while creating agent session');
	}
};
