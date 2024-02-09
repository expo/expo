import { execSync } from 'child_process';
import { lookup } from 'dns';

jest.mock('child_process');
jest.mock('dns');

// Reset env vars
beforeEach(() => {
  delete process.env.https_proxy;
  delete process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW;
});

it(`returns false when registry.yarnpkg.com can be reached`, async () => {
  // Mock DNS to fail at finding the URL
  jest.mocked(lookup).mockImplementation((url, callback) => {
    callback(null, '', 4); // IPv4
  });

  const { isYarnOfflineAsync } = require('../yarn');
  expect(await isYarnOfflineAsync()).toBe(false);
});

it(`allows an npm proxy`, async () => {
  // Mock npm cli command
  jest.mocked(execSync).mockImplementation(() => 'https://expo.dev');
  // Mock DNS to fail at finding the URL
  jest.mocked(lookup).mockImplementation((url, callback) => {
    if (url === 'registry.yarnpkg.com') {
      callback(new Error(), '', 4); // IPv4
    }

    callback(null, '', 4); // IPv4
  });

  const { isYarnOfflineAsync } = require('../yarn');
  expect(await isYarnOfflineAsync()).toBe(false);
});

describe('getNpmProxy', () => {
  beforeAll(() => {
    jest.mocked(execSync).mockImplementation(() => {
      if (process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW) {
        throw new Error('failed');
      }
      return 'something';
    });
  });

  it(`uses the env variable https_proxy for the proxy`, async () => {
    process.env.https_proxy = 'mock-value';
    const { getNpmProxy } = require('../yarn');
    expect(getNpmProxy()).toBe('mock-value');
  });

  it(`returns null when npm cli has an error`, async () => {
    process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW = 'true';
    const { getNpmProxy } = require('../yarn');
    expect(getNpmProxy()).toBe(null);
  });

  it(`fetches the proxy from npm CLI`, async () => {
    const { getNpmProxy } = require('../yarn');
    expect(getNpmProxy()).toBe('something');
  });
});
