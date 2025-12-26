import { NodeEnv } from '../constraints/enums/core-enums';

export const CODER_WORKSPACE_ID = process.env.CODER_WORKSPACE_ID ?? 'testing-workspace-id'; // null;
export const NODE_ENV = (process.env.NODE_ENV ?? NodeEnv.DEVELOPMENT) as NodeEnv;

export const API_KEY = process.env.REACT_APP_API_KEY;
