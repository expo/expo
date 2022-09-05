// Reset proxy
beforeEach(() => {
  delete process.env.https_proxy;
});

it(`returns false when registry.yarnpkg.com can be reached`, async () => {
  // Mock DNS to fail at finding the URL
  jest.mock('dns', () => {
    return {
      lookup(url, callback) {
        callback(null);
      },
    };
  });

  const isYarnOfflineAsync = require('../isYarnOfflineAsync').default;
  expect(await isYarnOfflineAsync()).toBe(false);
});
it(`allows an npm proxy`, async () => {
  // Mock DNS to fail at finding the URL
  jest.mock('dns', () => {
    return {
      lookup(url, callback) {
        if (url === 'registry.yarnpkg.com') {
          callback(new Error());
        }
        callback(null);
      },
    };
  });
  // Mock npm to return a null
  jest.mock('child_process', () => {
    return {
      execSync() {
        return 'https://expo.dev';
      },
    };
  });

  const isYarnOfflineAsync = require('../isYarnOfflineAsync').default;
  expect(await isYarnOfflineAsync()).toBe(false);
});

describe('getNpmProxy', () => {
  beforeAll(() => {
    jest.mock('child_process', () => {
      return {
        execSync: () => {
          if (process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW) {
            throw new Error('failed');
          }
          return 'something';
        },
      };
    });
  });
  beforeEach(() => {
    delete process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW;
  });
  it(`uses the env variable https_proxy for the proxy`, async () => {
    process.env.https_proxy = 'mock-value';
    const { getNpmProxy } = require('../isYarnOfflineAsync');
    expect(getNpmProxy()).toBe('mock-value');
  });
  it(`returns null when npm cli has an error`, async () => {
    process.env.YARN_OFFLINE_TEST_VALUE_SHOULD_THROW = 'true';
    const { getNpmProxy } = require('../isYarnOfflineAsync');
    expect(getNpmProxy()).toBe(null);
  });

  it(`fetches the proxy from npm CLI`, async () => {
    const { getNpmProxy } = require('../isYarnOfflineAsync');
    expect(getNpmProxy()).toBe('something');
  });
});
