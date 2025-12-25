import { create } from 'zustand';
import { CopilotState, CopilotStore } from '../constraints/types/copilot-types';
import { populateAgentSessionsAction } from '../actions/copilot-actions';
import { AgentSession } from '../constraints/types/copilot-types';

const defaultInitialState: CopilotState = {
	agentSessions: [] as AgentSession[],
	isAgentSessionsLoading: true,

	isNewChatLoading: false
};

export const useCopilotStore = create<CopilotStore>((set, _get) => ({
	...defaultInitialState,
	populateAgentSessions: () => populateAgentSessionsAction(set),
	setIsNewChatLoading: (isNewChatLoading: boolean) => set({ isNewChatLoading }),
	resetStore: () => set({ ...defaultInitialState })
}));
