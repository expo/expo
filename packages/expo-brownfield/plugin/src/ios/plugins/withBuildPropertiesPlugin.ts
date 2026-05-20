import type { ConfigPlugin } from 'expo/config-plugins';
import withBuildProperties from 'expo-build-properties';

import type { PluginConfig } from '../types';

const withBuildPropertiesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withBuildProperties(config, {
    ios: { buildReactNativeFromSource: pluginConfig.buildReactNativeFromSource },
  });
};

export default withBuildPropertiesPlugin;
