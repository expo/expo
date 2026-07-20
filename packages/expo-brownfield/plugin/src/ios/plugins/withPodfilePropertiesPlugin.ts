import { type ConfigPlugin, withPodfileProperties } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

// NOTE: Keep in sync with cli/src/utils/config.ts
const HOST_PROVIDED_FRAMEWORKS_KEY = 'ios.brownfieldHostProvidedFrameworks';

const withPodfilePropertiesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfileProperties(config, (config) => {
    if (pluginConfig.buildReactNativeFromSource) {
      config.modResults['ios.useFrameworks'] = 'static';
    }

    if (pluginConfig.hostProvidedFrameworks.length > 0) {
      config.modResults[HOST_PROVIDED_FRAMEWORKS_KEY] = JSON.stringify(
        pluginConfig.hostProvidedFrameworks
      );
    } else {
      delete config.modResults[HOST_PROVIDED_FRAMEWORKS_KEY];
    }
    return config;
  });
};

export default withPodfilePropertiesPlugin;
