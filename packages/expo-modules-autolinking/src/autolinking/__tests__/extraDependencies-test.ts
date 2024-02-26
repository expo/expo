import { getConfig } from '@expo/config';

import { getBuildPropertiesAsync, resolveExtraDependenciesAsync } from '../extraDependencies';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
}));
jest.mock('find-up', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue('/app/package.json'),
}));

const defaultConfig = { exp: {} } as ReturnType<typeof getConfig>;

describe(getBuildPropertiesAsync, () => {
  it('should return empty object when there is no expo-build-properties plugin', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [],
      },
    });
    expect(await getBuildPropertiesAsync('/app')).toEqual({});

    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: ['test-plugin'],
      },
    });
    expect(await getBuildPropertiesAsync('/app')).toEqual({});
  });

  it('should return empty object when expo-build-properties has no options', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [['expo-build-properties']],
      },
    });
    expect(await getBuildPropertiesAsync('/app')).toEqual({});
  });

  it('should return the `iosPods` array', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [['expo-build-properties', { hello: 'world' }]],
      },
    });
    expect(await getBuildPropertiesAsync('/app')).toEqual({ hello: 'world' });
  });
});

describe(resolveExtraDependenciesAsync, () => {
  it('should resolve dependencies from expo-build-properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [
          [
            'expo-build-properties',
            {
              android: { extraMavenRepos: ['https://customers.pspdfkit.com/maven/'] },
              ios: { extraPods: [{ name: 'test' }] },
            },
          ],
        ],
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [
          "https://customers.pspdfkit.com/maven/",
        ],
        "iosPods": [
          {
            "name": "test",
          },
        ],
      }
    `);
  });

  it('should resolve maven dependencies for basic authentication with credentials from expo-build-properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [
          [
            'expo-build-properties',
            {
              android: {
                extraMavenRepos: [
                  {
                    url: 'https://customers.pspdfkit.com/maven/',
                    credentials: {
                      username: 'user',
                      password: 'password',
                    },
                    authentication: 'basic',
                  },
                ],
              },
            },
          ],
        ],
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [
          {
            "authentication": "basic",
            "credentials": {
              "password": "password",
              "username": "user",
            },
            "url": "https://customers.pspdfkit.com/maven/",
          },
        ],
        "iosPods": {},
      }
    `);
  });

  it('should resolve maven dependencies for http header authentication with credentials from expo-build-properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [
          [
            'expo-build-properties',
            {
              android: {
                extraMavenRepos: [
                  {
                    url: 'https://customers.pspdfkit.com/maven/',
                    credentials: {
                      name: 'token',
                      value: 'some_token',
                    },
                    authentication: 'header',
                  },
                ],
              },
            },
          ],
        ],
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [
          {
            "authentication": "header",
            "credentials": {
              "name": "token",
              "value": "some_token",
            },
            "url": "https://customers.pspdfkit.com/maven/",
          },
        ],
        "iosPods": {},
      }
    `);
  });

  it('should resolve maven dependencies for digest authentication with credentials from expo-build-properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [
          [
            'expo-build-properties',
            {
              android: {
                extraMavenRepos: [
                  {
                    url: 'https://customers.pspdfkit.com/maven/',
                    credentials: {
                      username: 'user',
                      password: 'password',
                    },
                    authentication: 'digest',
                  },
                ],
              },
            },
          ],
        ],
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [
          {
            "authentication": "digest",
            "credentials": {
              "password": "password",
              "username": "user",
            },
            "url": "https://customers.pspdfkit.com/maven/",
          },
        ],
        "iosPods": {},
      }
    `);
  });

  it('should resolve maven dependencies with AWS credentials from expo-build-properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [
          [
            'expo-build-properties',
            {
              android: {
                extraMavenRepos: [
                  {
                    url: 'https://customers.pspdfkit.com/maven/',
                    credentials: {
                      accessKey: 'access_key',
                      secretKey: 'secret_key',
                      sessionToken: 'session_token',
                    },
                  },
                ],
              },
            },
          ],
        ],
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [
          {
            "credentials": {
              "accessKey": "access_key",
              "secretKey": "secret_key",
              "sessionToken": "session_token",
            },
            "url": "https://customers.pspdfkit.com/maven/",
          },
        ],
        "iosPods": {},
      }
    `);
  });

  it('should return empty array or object if no speicifed any properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
      },
    });
    expect(await resolveExtraDependenciesAsync('/app')).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [],
        "iosPods": {},
      }
    `);
  });
});
