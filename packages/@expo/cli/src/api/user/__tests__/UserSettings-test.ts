import fs from 'fs-extra';
import { vol } from 'memfs';
import path from 'path';

import {
  getAccessToken,
  getSession,
  getSettingsDirectory,
  getSettingsFilePath,
  setSessionAsync,
} from '../UserSettings';

describe(getSettingsDirectory, () => {
  beforeEach(() => {
    delete process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_LOCAL;
  });
  afterAll(() => {
    delete process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    delete process.env.EXPO_STAGING;
    delete process.env.EXPO_LOCAL;
  });

  it(`gets the default state directory`, () => {
    expect(getSettingsDirectory()).toBe('/home/.expo');
  });
  it(`gets the staging state directory`, () => {
    process.env.EXPO_STAGING = 'true';
    expect(getSettingsDirectory()).toBe('/home/.expo-staging');
  });
  it(`gets the local state directory`, () => {
    process.env.EXPO_LOCAL = 'true';
    expect(getSettingsDirectory()).toBe('/home/.expo-local');
  });
  it(`gets the custom state directory`, () => {
    process.env.__UNSAFE_EXPO_HOME_DIRECTORY = '/foobar/yolo';
    expect(getSettingsDirectory()).toBe('/foobar/yolo');
  });
});

const authStub: any = {
  sessionSecret: 'SESSION_SECRET',
  userId: 'USER_ID',
  username: 'USERNAME',
  currentConnection: 'Username-Password-Authentication',
};

beforeEach(() => {
  vol.reset();
});

describe(getSession, () => {
  it('returns null when session is not stored', () => {
    expect(getSession()).toBeNull();
  });

  it('returns stored session data', async () => {
    await fs.mkdirp(path.dirname(getSettingsFilePath()));
    await fs.writeJSON(getSettingsFilePath(), { auth: authStub });
    expect(getSession()).toMatchObject(authStub);
  });
});

describe(setSessionAsync, () => {
  it('stores empty session data', async () => {
    await setSessionAsync();
    expect(await fs.pathExists(getSettingsFilePath())).toBeTruthy();
  });

  it('stores actual session data', async () => {
    await setSessionAsync(authStub);
    expect(await fs.readJSON(getSettingsFilePath())).toMatchObject({ auth: authStub });
  });
});

describe(getAccessToken, () => {
  it('returns null when envvar is undefined', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('returns token when envar is defined', () => {
    process.env.EXPO_TOKEN = 'mytesttoken';
    expect(getAccessToken()).toBe('mytesttoken');
    process.env.EXPO_TOKEN = undefined;
  });
});
