import { mkdirSync } from 'fs';

import { getAccountUsername } from '../getFullName';
import { getExpoHomeDirectory, getUserState } from '../getUserState';

jest.mock('os');
jest.mock('fs');

describe(getAccountUsername, () => {
  beforeEach(() => {
    delete process.env.EXPO_CLI_USERNAME;
    delete process.env.EAS_BUILD_USERNAME;
  });

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
    await mkdirSync(getExpoHomeDirectory(), { recursive: true });
    // Set a username...
    await getUserState().setAsync('auth', { username: 'bacon-boi' });
    // Check the username...
    expect(getAccountUsername()).toBe('bacon-boi');
  });
});
