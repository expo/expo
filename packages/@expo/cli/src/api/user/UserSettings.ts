import JsonFile from '@expo/json-file';
import crypto from 'crypto';
import { boolish } from 'getenv';
import { homedir } from 'os';
import * as path from 'path';

type SessionData = {
  sessionSecret?: string;
  userId?: string;
  username?: string;
  currentConnection?: 'Username-Password-Authentication' | 'Browser-Flow-Authentication';
};

export type UserSettingsData = {
  auth?: SessionData | null;
  ignoreBundledBinaries?: string[];
  PATH?: string;
  /** Last development code signing ID used for `npx expo run:ios`. */
  developmentCodeSigningId?: string;
  /** Unique user ID which is generated anonymously and can be cleared locally. */
  uuid?: string;
};

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

/** Return the user cache directory. */
export function getSettingsDirectory() {
  return getExpoHomeDirectory();
}

/** Return the file path of the settings file */
export function getSettingsFilePath(): string {
  return path.join(getExpoHomeDirectory(), 'state.json');
}

/** Get a new JsonFile instance pointed towards the settings file */
export function getSettings(): JsonFile<UserSettingsData> {
  return new JsonFile<UserSettingsData>(getSettingsFilePath(), {
    ensureDir: true,
    jsonParseErrorDefault: {},
    // This will ensure that an error isn't thrown if the file doesn't exist.
    cantReadFileDefault: {},
  });
}

export function getAccessToken(): string | null {
  return process.env.EXPO_TOKEN ?? null;
}

export function getSession() {
  return getSettings().get('auth', null);
}

export async function setSessionAsync(sessionData?: SessionData) {
  await getSettings().setAsync('auth', sessionData, {
    default: {},
    ensureDir: true,
  });
}

/**
 * Check if there are credentials available, without fetching the user information.
 * This can be used as a faster check to see if users are authenticated.
 * Note, this isn't checking the validity of the credentials.
 */
export function hasCredentials() {
  return !!getAccessToken() || !!getSession();
}

/**
 * Get an anonymous and randomly generated identifier.
 * This is used to group telemetry event by unknown actor,
 * and cannot be used to identify a single user.
 */
export async function getAnonymousIdAsync(): Promise<string> {
  const settings = getSettings();
  let id = await settings.getAsync('uuid', null);

  if (!id) {
    id = crypto.randomUUID();
    await settings.setAsync('uuid', id);
  }

  return id;
}

/**
 * Get an anonymous and randomly generated identifier.
 * This is used to group telemetry event by unknown actor,
 * and cannot be used to identify a single user.
 */
export function getAnonymousId(): string {
  const settings = getSettings();
  let id = settings.get('uuid', null);

  if (!id) {
    id = crypto.randomUUID();
    settings.set('uuid', id);
  }

  return id;
}
