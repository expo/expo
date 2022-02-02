import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import JsonFile from '@expo/json-file';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

type UserData = any;

export type UserSettingsData = {
  developmentCodeSigningId?: string;
  appleId?: string;
  accessToken?: string;
  auth?: UserData | null;
  ignoreBundledBinaries?: string[];
  PATH?: string;
  uuid?: string;
};

function userSettingsFile(): string {
  return path.join(getDirectory(), 'state.json');
}

function userSettingsJsonFile(): JsonFile<UserSettingsData> {
  return new JsonFile<UserSettingsData>(userSettingsFile(), {
    jsonParseErrorDefault: {},
    cantReadFileDefault: {},
  });
}

let ensureDirectoryCreated = false;

/** Return the user cache directory. */
function getDirectory() {
  const dir = getExpoHomeDirectory();
  if (!ensureDirectoryCreated) {
    fs.mkdirSync(dir, { recursive: true });
    ensureDirectoryCreated = true;
  }
  return dir;
}

// returns an anonymous, unique identifier for a user on the current computer
async function getAnonymousIdentifierAsync(): Promise<string> {
  const settings = await userSettingsJsonFile();
  let id = await settings.getAsync('uuid', null);

  if (!id) {
    id = uuidv4();
    await settings.setAsync('uuid', id);
  }

  return id;
}

const UserSettings = Object.assign(userSettingsJsonFile(), {
  getDirectory,
  userSettingsFile,
  userSettingsJsonFile,
  getAnonymousIdentifierAsync,
});

export default UserSettings;
