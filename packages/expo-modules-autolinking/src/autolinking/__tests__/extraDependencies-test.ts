import { getConfig } from '@expo/config';

import { getBuildPropertiesAsync, resolveExtraDependenciesAsync } from '../extraDependencies';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
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
    expect(await getBuildPropertiesAsync()).toEqual({});

    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: ['test-plugin'],
      },
    });
    expect(await getBuildPropertiesAsync()).toEqual({});
  });

  it('should return empty object when expo-build-properties has no options', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [['expo-build-properties']],
      },
    });
    expect(await getBuildPropertiesAsync()).toEqual({});
  });

  it('should return the `iosPods` array', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
        plugins: [['expo-build-properties', { hello: 'world' }]],
      },
    });
    expect(await getBuildPropertiesAsync()).toEqual({ hello: 'world' });
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
    expect(await resolveExtraDependenciesAsync()).toMatchInlineSnapshot(`
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

  it('should return empty array or object if no speicifed any properties', async () => {
    (getConfig as jest.MockedFunction<typeof getConfig>).mockReturnValueOnce({
      ...defaultConfig,
      exp: {
        ...defaultConfig.exp,
      },
    });
    expect(await resolveExtraDependenciesAsync()).toMatchInlineSnapshot(`
      {
        "androidMavenRepos": [],
        "iosPods": {},
      }
    `);
  });
});
