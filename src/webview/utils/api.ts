import { DEFAULT_COPILOT_AGENT_ID } from '../../constants';

export const apiKey = process.env.REACT_APP_API_KEY;
export const baseUrl = process.env.REACT_APP_API_URL;

export const serviceUrls = {
	agentService: {
		v1: `${baseUrl}/${process.env.REACT_APP_AGENT_SERVICE_PATH}/v1`
	}
};

export const routes = {
	agents: {
		createSessionID: () => `${serviceUrls.agentService.v1}/agents/session/generate`,
		getAgentSessions: (agentId: string = DEFAULT_COPILOT_AGENT_ID) =>
			`${serviceUrls.agentService.v1}/playground/agents/${agentId}/sessions`,
		getAgentSessionDetails: (sessionId: string, agentId: string = DEFAULT_COPILOT_AGENT_ID) =>
			`${serviceUrls.agentService.v1}/playground/agents/${agentId}/sessions/${sessionId}`,
		runAgent: (agentId: string = DEFAULT_COPILOT_AGENT_ID) =>
			`${serviceUrls.agentService.v1}/system/agents/${agentId}/runs`,
		deleteAgentSession: (sessionId: string, agentId: string = DEFAULT_COPILOT_AGENT_ID) =>
			`${serviceUrls.agentService.v1}/system/agents/${agentId}/sessions/${sessionId}`
	}
};
