import { withGradleProperties } from '@expo/config-plugins/build/plugins/android-plugins';
import { withPodfileProperties } from '@expo/config-plugins/build/plugins/ios-plugins';

import type { PluginConfigType } from '../pluginConfig';
import { withBuildProperties } from '../withBuildProperties';
import { compileMockModWithResultsAsync } from './mockMods';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    withDangerousMod: jest.fn().mockImplementation((config) => config),
  };
});

jest.mock('@expo/config-plugins/build/plugins/android-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/android-plugins');
  return {
    ...plugins,
    withGradleProperties: jest.fn().mockImplementation((config) => config),
  };
});

jest.mock('@expo/config-plugins/build/plugins/ios-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/ios-plugins');
  return {
    ...plugins,
    withPodfileProperties: jest.fn().mockImplementation((config) => config),
  };
});

describe(withBuildProperties, () => {
  it('should generate new build properties', async () => {
    const pluginProps: PluginConfigType = {
      android: { compileSdkVersion: 31, targetSdkVersion: 30 },
      ios: { useFrameworks: 'static' },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withGradleProperties,
        modResults: [],
      }
    );
    expect(androidModResults).toContainEqual({
      type: 'property',
      key: 'android.compileSdkVersion',
      value: '31',
    });
    expect(androidModResults).toContainEqual({
      type: 'property',
      key: 'android.targetSdkVersion',
      value: '30',
    });

    const { modResults: iosModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(iosModResults).toMatchObject({
      'ios.useFrameworks': 'static',
    });
  });

  it('should overwrite existing properties', async () => {
    const pluginProps: PluginConfigType = {
      android: { compileSdkVersion: 31 },
      ios: { useFrameworks: 'static' },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withGradleProperties,
        modResults: [{ type: 'property', key: 'android.compileSdkVersion', value: '30' }],
      }
    );
    expect(androidModResults).toEqual([
      {
        type: 'property',
        key: 'android.compileSdkVersion',
        value: '31',
      },
    ]);

    const { modResults: iosModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withPodfileProperties,
        modResults: { 'ios.useFrameworks': 'dynamic' } as Record<string, string>,
      }
    );
    expect(iosModResults).toEqual({
      'ios.useFrameworks': 'static',
    });
  });

  it('should leave existing properties unchanged', async () => {
    const pluginProps: PluginConfigType = {};

    const { modResults: androidModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withGradleProperties,
        modResults: [{ type: 'property', key: 'android.compileSdkVersion', value: '30' }],
      }
    );
    expect(androidModResults).toEqual([
      {
        type: 'property',
        key: 'android.compileSdkVersion',
        value: '30',
      },
    ]);

    const { modResults: iosModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withPodfileProperties,
        modResults: { 'ios.useFrameworks': 'dynamic' } as Record<string, string>,
      }
    );
    expect(iosModResults).toEqual({
      'ios.useFrameworks': 'dynamic',
    });
  });

  it('should throw an error for invalid plugin config', async () => {
    const invalidConfig = {
      android: { targetSdkVersion: 'invalidString' },
    } as any as PluginConfigType;

    expect(async () => {
      await compileMockModWithResultsAsync(
        {},
        {
          plugin: withBuildProperties,
          pluginProps: invalidConfig,
          mod: withGradleProperties,
          modResults: [{ type: 'property', key: 'android.compileSdkVersion', value: '30' }],
        }
      );
    }).rejects.toThrow();
  });
});
