import { type ConfigPlugin, withPodfile } from 'expo/config-plugins';

import type { PluginConfig } from '../types';
import { addCustomRubyScriptImport, addNewPodsTarget } from '../utils';

const withPodfilePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withPodfile(config, (config) => {
    config.modResults.contents = addCustomRubyScriptImport(
      config.modResults.contents,
      pluginConfig.targetName
    );
    config.modResults.contents = addNewPodsTarget(
      config.modResults.contents,
      pluginConfig.targetName
    );
    return config;
  });
};

export default withPodfilePlugin;
