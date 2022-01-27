import JsonFile from '@expo/json-file';
import os from 'os';
import path from 'path';
import process from 'process';

// Extracted from https://github.com/sindresorhus/env-paths/blob/main/index.js
function getConfigDirectory() {
  // Share data between eas-cli and expo.
  const name = 'eas-cli';
  const homedir = os.homedir();

  if (process.platform === 'darwin') {
    const library = path.join(homedir, 'Library');
    return path.join(library, 'Preferences', name);
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
    return path.join(appData, name, 'Config');
  }

  // https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
  return path.join(process.env.XDG_CONFIG_HOME || path.join(homedir, '.config'), name);
}

const SETTINGS_FILE_PATH = path.join(getConfigDirectory(), 'user-settings.json');

export type UserSettingsData = {
  appleId?: string;
  amplitudeDeviceId?: string;
  amplitudeEnabled?: boolean;
  analyticsDeviceId?: string;
  analyticsEnabled?: boolean;
};

const UserSettings = new JsonFile<UserSettingsData>(SETTINGS_FILE_PATH, {
  jsonParseErrorDefault: {},
  cantReadFileDefault: {},
  ensureDir: true,
});

export default UserSettings;
