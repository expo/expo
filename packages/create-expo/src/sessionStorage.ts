import JsonFile from '@expo/json-file';

import { getStateJsonPath } from './paths';

// copied from https://github.com/expo/eas-cli/blob/f0c958e58bc7aa90ee8f822e075d40703563708e/packages/eas-cli/src/user/sessionStorage.ts

type UserSettingsData = {
  auth?: SessionData;
};

type SessionData = {
  sessionSecret: string;

  // These fields are potentially used by Expo CLI.
  userId: string;
  username: string;
  currentConnection: 'Username-Password-Authentication';
};

export function getSession(): SessionData | null {
  try {
    return JsonFile.read<UserSettingsData>(getStateJsonPath())?.auth ?? null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
