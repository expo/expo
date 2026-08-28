// @ref llp/0015-backend-selection-and-config.rfc.md
// The developer's own preferences: which app the project runs in, and where its native builds run.
// One file (`package.json` › `expo.agentCli`), one parser, one resolver per question.

export { parseAgentCliSettings, settingsAreEmpty, settingsBuildBackend } from './parse';
export {
  readAgentCliSettings,
  resetSettingsCache,
  CONFIG_FILE_NAME,
  CONFIG_KEY_PATH,
  CONFIG_LOCATION,
} from './read';
export {
  EMPTY_SETTINGS,
  NO_SETTINGS,
  type BuildBackend,
  type AgentCliSettings,
  type LoadedSettings,
  type PlatformSettings,
  type RunTarget,
} from './types';
