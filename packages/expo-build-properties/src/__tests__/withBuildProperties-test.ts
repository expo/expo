import { AndroidConfig, withGradleProperties, withPodfileProperties } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import type { PluginConfigType } from '../pluginConfig';
import { withBuildProperties } from '../withBuildProperties';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withDangerousMod: jest.fn().mockImplementation((config) => config),
  };
});

// These two mocks are for the internal imports in `createBuildGradlePropsConfigPlugin`
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
      android: { compileSdkVersion: 31, targetSdkVersion: 32 },
      ios: { useFrameworks: 'static' },
    };

    const { modResults: androidModResults } = await compileMockModWithResultsAsync<
      AndroidConfig.Properties.PropertiesItem[],
      PluginConfigType
    >(
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
      value: '32',
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
    expect(androidModResults).toContainEqual({
      type: 'property',
      key: 'android.compileSdkVersion',
      value: '31',
    });

    const { modResults: iosModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withPodfileProperties,
        modResults: { 'ios.useFrameworks': 'dynamic' } as Record<string, string>,
      }
    );
    expect(iosModResults).toMatchObject({
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
    expect(androidModResults).toContainEqual({
      type: 'property',
      key: 'android.compileSdkVersion',
      value: '30',
    });

    const { modResults: iosModResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps,
        mod: withPodfileProperties,
        modResults: { 'ios.useFrameworks': 'dynamic' } as Record<string, string>,
      }
    );
    expect(iosModResults).toMatchObject({
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

  it('generates the apple.ccacheEnabled property', async () => {
    const { modResults: iosModResultsEnabled } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps: { ios: { ccacheEnabled: true } },
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(iosModResultsEnabled).toMatchObject({
      'apple.ccacheEnabled': 'true',
    });
  });

  it('generates the apple.privacyManifestAggregationEnabled property', async () => {
    const { modResults: iosModResultsEnabled } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withBuildProperties,
        pluginProps: { ios: { privacyManifestAggregationEnabled: true } },
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(iosModResultsEnabled).toMatchObject({
      'apple.privacyManifestAggregationEnabled': 'true',
    });
  });
});
