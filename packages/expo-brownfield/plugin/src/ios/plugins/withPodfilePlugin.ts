import { type ConfigPlugin, withPodfile } from 'expo/config-plugins';

import type { PluginConfig } from '../types';
import { addNewPodsTarget, addPrebuiltSettings } from '../utils';

const withPodfilePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfile(config, (config) => {
    config.modResults.contents = addNewPodsTarget(
      config.modResults.contents,
      pluginConfig.targetName
    );
    if (!pluginConfig.buildReactNativeFromSource) {
      config.modResults.contents = addPrebuiltSettings(config.modResults.contents);
    }
    return config;
  });
};

export default withPodfilePlugin;
