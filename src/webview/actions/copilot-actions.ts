import { CopilotState } from '../constraints/types/copilot-types';
import { getAgentSessionsService } from '../services/copilot-service';

export const populateAgentSessionsAction = async (
	set: (partial: Partial<CopilotState>) => void
) => {
	set({ isAgentSessionsLoading: true });
	const agentSessions = await getAgentSessionsService();
	set({ agentSessions, isAgentSessionsLoading: false });
};
