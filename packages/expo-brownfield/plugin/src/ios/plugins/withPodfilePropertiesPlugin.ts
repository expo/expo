import { type ConfigPlugin, withPodfileProperties } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

const withPodfilePropertiesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfileProperties(config, (config) => {
    config.modResults['ios.useFrameworks'] = 'static';
    config.modResults['ios.brownfieldTargetName'] = pluginConfig.targetName;
    return config;
  });
};

export default withPodfilePropertiesPlugin;
