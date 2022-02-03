import { getUserStatePath } from '@expo/config/build/getUserState';
import fs from 'fs-extra';
import { vol } from 'memfs';
import path from 'path';

import { getAccessToken, getSession, getSessionSecret, setSessionAsync } from '../sessionStorage';

jest.mock('fs');

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
    await fs.mkdirp(path.dirname(getUserStatePath()));
    await fs.writeJSON(getUserStatePath(), { auth: authStub });
    expect(getSession()).toMatchObject(authStub);
  });
});

describe(setSessionAsync, () => {
  it('stores empty session data', async () => {
    await setSessionAsync();
    expect(await fs.pathExists(getUserStatePath())).toBeTruthy();
  });

  it('stores actual session data', async () => {
    await setSessionAsync(authStub);
    expect(await fs.readJSON(getUserStatePath())).toMatchObject({ auth: authStub });
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

describe(getSessionSecret, () => {
  it('returns null when session is not stored', () => {
    expect(getSessionSecret()).toBeNull();
  });

  it('returns secret when session is stored', async () => {
    await setSessionAsync(authStub);
    expect(getSessionSecret()).toBe(authStub.sessionSecret);
  });
});
