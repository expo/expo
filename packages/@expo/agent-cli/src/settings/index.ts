// @ref llp/0015-backend-selection-and-config.rfc.md
// The developer's own preferences: which app the project runs in, and where its native builds run.
// One file (`package.json` › `expo.exagent`), one parser, one resolver per question.

export { parseExagentSettings, settingsAreEmpty, settingsBuildBackend } from './parse';
export {
  readExagentSettings,
  resetSettingsCache,
  CONFIG_FILE_NAME,
  CONFIG_KEY_PATH,
  CONFIG_LOCATION,
} from './read';
export {
  EMPTY_SETTINGS,
  NO_SETTINGS,
  type BuildBackend,
  type ExagentSettings,
  type LoadedSettings,
  type PlatformSettings,
  type RunTarget,
} from './types';
