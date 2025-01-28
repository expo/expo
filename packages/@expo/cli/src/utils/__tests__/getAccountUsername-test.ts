import fs from 'fs';
import { vol } from 'memfs';

import { getExpoHomeDirectory, getSettings } from '../../api/user/UserSettings';
import { getAccountUsername } from '../getAccountUsername';

jest.mock('os');
jest.mock('fs');

// NOTE(cedric): this is a workaround to also mock `node:fs`
jest.mock('node:fs', () => require('fs'));

describe(getAccountUsername, () => {
  beforeEach(() => {
    delete process.env.EXPO_CLI_USERNAME;
    delete process.env.EAS_BUILD_USERNAME;
  });
  afterEach(() => vol.reset());

  it(`gets the account name from EXPO_CLI_USERNAME`, () => {
    process.env.EXPO_CLI_USERNAME = 'expo-cli-username';
    process.env.EAS_BUILD_USERNAME = 'eas-build-username';
    expect(getAccountUsername()).toBe('expo-cli-username');
  });
  it(`gets the account name from EAS_BUILD_USERNAME`, () => {
    process.env.EAS_BUILD_USERNAME = 'eas-build-username';
    expect(getAccountUsername()).toBe('eas-build-username');
  });
  it(`gets the account name from owner`, () => {
    process.env.EXPO_CLI_USERNAME = 'expo-cli-username';
    process.env.EAS_BUILD_USERNAME = 'eas-build-username';
    expect(getAccountUsername({ owner: 'owner-username' })).toBe('owner-username');
  });
  it(`gets the account name from owner 2`, () => {
    expect(getAccountUsername({ owner: 'owner-username' })).toBe('owner-username');
  });
  it(`uses anonymous name`, () => {
    // Ensure the test doesn't interact with the developer's state.json
    expect(getExpoHomeDirectory()).toBe('/home/.expo');
    expect(getAccountUsername()).toBe('anonymous');
  });
  it(`uses previously authenticated username`, async () => {
    // Ensure the test doesn't interact with the developer's state.json
    expect(getExpoHomeDirectory()).toBe('/home/.expo');
    // Ensure the dir exists
    fs.mkdirSync(getExpoHomeDirectory(), { recursive: true });
    // Set a username...
    await getSettings().setAsync('auth', { username: 'bacon-boi' });
    // Check the username...
    expect(getAccountUsername()).toBe('bacon-boi');
  });
});
