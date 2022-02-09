import { getUserStatePath } from '@expo/config/build/getUserState';
import JsonFile from '@expo/json-file';

type SessionData = {
  sessionSecret: string;

  // These fields are potentially used by Expo CLI.
  userId: string;
  username: string;
  currentConnection: 'Username-Password-Authentication';
};

export function getSession(): SessionData | null {
  try {
    return (
      JsonFile.read<{
        auth?: SessionData;
      }>(getUserStatePath())?.auth ?? null
    );
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function setSessionAsync(sessionData?: SessionData): Promise<void> {
  await JsonFile.setAsync(getUserStatePath(), 'auth', sessionData, {
    default: {},
    ensureDir: true,
  });
}

export function getAccessToken(): string | null {
  // TODO: Move to env
  return process.env.EXPO_TOKEN ?? null;
}

export function getSessionSecret(): string | null {
  return getSession()?.sessionSecret ?? null;
}
