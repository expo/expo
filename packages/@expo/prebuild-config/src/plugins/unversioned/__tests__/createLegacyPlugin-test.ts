import { ExpoConfig } from '@expo/config';
import * as ConfigPlugins from '@expo/config-plugins';

import { createLegacyPlugin } from '../createLegacyPlugin';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    withStaticPlugin: jest.fn(plugins.withStaticPlugin),
  };
});

describe(createLegacyPlugin, () => {
  it(`uses fallback`, () => {
    const fallback = jest.fn(config => config);
    const withPlugin = createLegacyPlugin({
      packageName: 'expo-foobar',
      fallback,
    });
    let config: ExpoConfig = { slug: '', name: '', _internal: { projectRoot: '/' } };
    config = withPlugin(config);
    expect(fallback).toBeCalledTimes(1);
    expect(config._internal.pluginHistory).toStrictEqual({
      'expo-foobar': {
        name: 'expo-foobar',
        version: 'UNVERSIONED',
      },
    });
    // Only invokes the fallback once
    config = withPlugin(config);
    expect(fallback).toBeCalledTimes(1);
  });

  it(`uses versioned plugin instead of fallback`, () => {
    require('@expo/config-plugins').withStaticPlugin = jest.fn();
    const fallback = jest.fn(config => config);
    const withPlugin = createLegacyPlugin({
      packageName: 'expo-foobar',
      fallback,
    });
    const config: ExpoConfig = { slug: '', name: '', _internal: { projectRoot: '/' } };
    withPlugin(config);
    expect(ConfigPlugins.withStaticPlugin).toBeCalledTimes(1);
    expect(fallback).toBeCalledTimes(0);
  });
});
