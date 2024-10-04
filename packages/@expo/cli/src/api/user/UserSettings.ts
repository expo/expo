import { getExpoHomeDirectory, getUserStatePath } from '@expo/config/build/getUserState';
import JsonFile from '@expo/json-file';
import crypto from 'crypto';

type SessionData = {
  sessionSecret: string;
  // These fields are potentially used by Expo CLI.
  userId: string;
  username: string;
  currentConnection: 'Username-Password-Authentication' | 'Browser-Flow-Authentication';
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

/** Return the user cache directory. */
export function getSettingsDirectory() {
  return getExpoHomeDirectory();
}

/** Return the file path of the settings file */
export function getSettingsFilePath(): string {
  return getUserStatePath();
}

/** Get a new JsonFile instance pointed towards the settings file */
export function getSettings(): JsonFile<UserSettingsData> {
  return new JsonFile<UserSettingsData>(getSettingsFilePath(), {
    ensureDir: true,
    jsonParseErrorDefault: {},
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
