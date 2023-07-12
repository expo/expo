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
function getDirectory() {
  return getExpoHomeDirectory();
}

function getFilePath(): string {
  return getUserStatePath();
}

function userSettingsJsonFile(): JsonFile<UserSettingsData> {
  return new JsonFile<UserSettingsData>(getFilePath(), {
    ensureDir: true,
    jsonParseErrorDefault: {},
    cantReadFileDefault: {},
  });
}

async function setSessionAsync(sessionData?: SessionData): Promise<void> {
  await UserSettings.setAsync('auth', sessionData, {
    default: {},
    ensureDir: true,
  });
}

function getSession(): SessionData | null {
  try {
    return JsonFile.read<UserSettingsData>(getUserStatePath())?.auth ?? null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function getAccessToken(): string | null {
  return process.env.EXPO_TOKEN ?? null;
}

// returns an anonymous, unique identifier for a user on the current computer
async function getAnonymousIdentifierAsync(): Promise<string> {
  const settings = await userSettingsJsonFile();
  let id = await settings.getAsync('uuid', null);

  if (!id) {
    id = crypto.randomUUID();
    await settings.setAsync('uuid', id);
  }

  return id;
}

const UserSettings = Object.assign(userSettingsJsonFile(), {
  getSession,
  setSessionAsync,
  getAccessToken,
  getDirectory,
  getFilePath,
  userSettingsJsonFile,
  getAnonymousIdentifierAsync,
});

export default UserSettings;
