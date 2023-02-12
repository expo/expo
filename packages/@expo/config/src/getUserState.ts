import JsonFile from '@expo/json-file';
import { boolish } from 'getenv';
import { homedir } from 'os';
import * as path from 'path';

export type UserSettingsData = {
  developmentCodeSigningId?: string;
  appleId?: string;
  accessToken?: string;
  auth?: UserData | null;
  ignoreBundledBinaries?: string[];
  openDevToolsAtStartup?: boolean;
  PATH?: string;
  sendTo?: string;
  uuid?: string;
};

export type UserData = {
  appleId?: string;
  userId?: string;
  username?: string;
  currentConnection?: ConnectionType;
  sessionSecret?: string;
};

export type ConnectionType =
  | 'Access-Token-Authentication'
  | 'Username-Password-Authentication'
  | 'facebook'
  | 'google-oauth2'
  | 'github';

// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
export function getExpoHomeDirectory() {
  const home = homedir();

  if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
    return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
  } else if (boolish('EXPO_STAGING', false)) {
    return path.join(home, '.expo-staging');
  } else if (boolish('EXPO_LOCAL', false)) {
    return path.join(home, '.expo-local');
  }
  return path.join(home, '.expo');
}

export function getUserStatePath() {
  return path.join(getExpoHomeDirectory(), 'state.json');
}

export function getUserState() {
  return new JsonFile<UserSettingsData>(getUserStatePath(), {
    jsonParseErrorDefault: {},
    // This will ensure that an error isn't thrown if the file doesn't exist.
    cantReadFileDefault: {},
  });
}
