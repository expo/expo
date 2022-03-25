import fs from 'fs-extra';
import { vol } from 'memfs';
import path from 'path';

import UserSettings from '../UserSettings';

describe(UserSettings.getDirectory, () => {
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
    expect(UserSettings.getDirectory()).toBe('/home/.expo');
  });
  it(`gets the staging state directory`, () => {
    process.env.EXPO_STAGING = 'true';
    expect(UserSettings.getDirectory()).toBe('/home/.expo-staging');
  });
  it(`gets the local state directory`, () => {
    process.env.EXPO_LOCAL = 'true';
    expect(UserSettings.getDirectory()).toBe('/home/.expo-local');
  });
  it(`gets the custom state directory`, () => {
    process.env.__UNSAFE_EXPO_HOME_DIRECTORY = '/foobar/yolo';
    expect(UserSettings.getDirectory()).toBe('/foobar/yolo');
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

describe(UserSettings.getSession, () => {
  it('returns null when session is not stored', () => {
    expect(UserSettings.getSession()).toBeNull();
  });

  it('returns stored session data', async () => {
    await fs.mkdirp(path.dirname(UserSettings.getFilePath()));
    await fs.writeJSON(UserSettings.getFilePath(), { auth: authStub });
    expect(UserSettings.getSession()).toMatchObject(authStub);
  });
});

describe(UserSettings.setSessionAsync, () => {
  it('stores empty session data', async () => {
    await UserSettings.setSessionAsync();
    expect(await fs.pathExists(UserSettings.getFilePath())).toBeTruthy();
  });

  it('stores actual session data', async () => {
    await UserSettings.setSessionAsync(authStub);
    expect(await fs.readJSON(UserSettings.getFilePath())).toMatchObject({ auth: authStub });
  });
});

describe(UserSettings.getAccessToken, () => {
  it('returns null when envvar is undefined', () => {
    expect(UserSettings.getAccessToken()).toBeNull();
  });

  it('returns token when envar is defined', () => {
    process.env.EXPO_TOKEN = 'mytesttoken';
    expect(UserSettings.getAccessToken()).toBe('mytesttoken');
    process.env.EXPO_TOKEN = undefined;
  });
});
