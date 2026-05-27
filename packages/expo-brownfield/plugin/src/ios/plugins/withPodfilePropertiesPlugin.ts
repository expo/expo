import { type ConfigPlugin, withPodfileProperties } from 'expo/config-plugins';

import type { PluginConfig } from '../types';

export const HOST_PROVIDED_FRAMEWORKS_KEY = 'ios.brownfieldHostProvidedFrameworks';

const withPodfilePropertiesPlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfileProperties(config, (config) => {
    if (pluginConfig.buildReactNativeFromSource) {
      config.modResults['ios.useFrameworks'] = 'static';
    }
    // Bridges the plugin's `ios.hostProvidedFrameworks` declaration to the CLI: stored as a
    // JSON-stringified array since Podfile.properties.json values are conventionally strings
    // (so the Ruby Podfile side can read them uniformly via `podfile_properties[...]`).
    // Only written when non-empty to keep the file tidy for projects that don't need it.
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
