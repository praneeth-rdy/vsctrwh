export const COMMANDS = {
	OPEN_CHAT: 'vsctrwh.openChat',
	CHAT_OPEN: 'workbench.action.chat.open',
	CHAT_OPEN_IN_EDITOR: 'workbench.action.chat.openInEditor',
	ANALYSE_WITH_MIO: 'vsctrwh.analyseWithMio'
} as const;

export const VIEW_IDS = {
	CHAT_VIEW: 'vsctrwhCustomChat'
} as const;

export const DEBOUNCE_DELAY_MS = 500;
export const MAX_MESSAGE_LENGTH = 10000;

export const DEFAULT_COPILOT_AGENT_ID = 'admin';
export const TALENT_COPILOT_AGENT_ID = 'coding_buddy';
