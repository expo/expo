import { type ConfigPlugin, withPodfileProperties } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

const withPodfilePropertiesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfileProperties(config, (config) => {
    if (pluginConfig.buildReactNativeFromSource) {
      config.modResults['ios.useFrameworks'] = 'static';
    }
    return config;
  });
};

export default withPodfilePropertiesPlugin;
