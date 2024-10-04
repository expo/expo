import { AndroidConfig, withAndroidManifest } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import { withAndroidQueries } from '../android';
import { PluginConfigType } from '../pluginConfig';

jest.mock('@expo/config-plugins/build/plugins/android-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/android-plugins');
  return {
    ...plugins,
    withAndroidManifest: jest.fn().mockImplementation((config) => config),
  };
});

const defaultQueries = [
  {
    package: [{ $: { 'android:name': 'com.expo.test' } }],
    intent: [
      {
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'https' } }],
        category: [{ $: { 'android:name': 'android.intent.category.BROWSABLE' } }],
      },
    ],
  },
];

describe(withAndroidQueries, () => {
  test('it does not change the manifest default if no queries are provided', async () => {
    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: {
          android: {
            manifestQueries: {
              package: ['com.expo.test'],
            },
          },
        },
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    expect(androidModResults.manifest.queries[0].intent).toHaveLength(1);
  });

  test('it adds the provider if defined', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.test'],
          provider: ['com.expo.provider'],
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result.provider).toBeDefined();
    expect(result.provider?.[0].$['android:authorities']).toBe('com.expo.provider');
  });

  test('it does not add the provider if undefined', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.test'],
          provider: undefined,
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result.provider).toHaveLength(0);
  });

  it('it changes the package name', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.dev'],
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result.package).toBeDefined();
    expect(result.package?.some((p) => p.$['android:name'] === 'com.expo.dev')).toBe(true);
    expect(result.package?.some((p) => p.$['android:name'] === 'com.expo.test')).toBe(true);
  });

  test('it correctly adds a single intent', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.test'],
          intent: [
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https', host: 'expo.io' },
              category: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
            },
          ],
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result?.intent).toHaveLength(2);
  });

  test('it correctly adds two intents', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.test'],
          intent: [
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https', host: 'expo.io' },
              category: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
            },
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https' },
              category: ['android.intent.category.DEFAULT'],
            },
          ],
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result.intent).toHaveLength(3);
  });

  test('it correctly adds three intents', async () => {
    const pluginConfig: PluginConfigType = {
      android: {
        manifestQueries: {
          package: ['com.expo.test'],
          intent: [
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https', host: 'expo.io' },
              category: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
            },
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https' },
              category: ['android.intent.category.DEFAULT'],
            },
            {
              action: 'android.intent.action.VIEW',
              data: { scheme: 'https', host: 'expo.io' },
              category: ['android.intent.category.BROWSABLE'],
            },
          ],
        },
      },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Manifest.AndroidManifest,
      PluginConfigType
    >(
      {},
      {
        plugin: withAndroidQueries,
        pluginProps: pluginConfig,
        mod: withAndroidManifest,
        modResults: {
          manifest: {
            $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
            queries: defaultQueries,
          },
        },
      }
    );
    const result = androidModResults.manifest.queries[0];
    expect(result.intent).toHaveLength(4);
  });
});
