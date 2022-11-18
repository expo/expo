import type { ConfigPlugin } from 'expo/config-plugins';

import {
  withAndroidBuildProperties,
  withAndroidProguardRules,
  withAndroidPurgeProguardRulesOnce,
} from './android';
import { withIosBuildProperties, withIosDeploymentTarget } from './ios';
import { PluginConfigType, validateConfig } from './pluginConfig';

/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 *
 * @param config ExpoConfig
 * @param props Configuration for the config plugin
 */
export const withBuildProperties: ConfigPlugin<PluginConfigType> = (config, props) => {
  const pluginConfig = validateConfig(props || {});

  config = withAndroidBuildProperties(config, pluginConfig);

  // Assuming `withBuildProperties` could be called multiple times from different config-plugins,
  // the `withAndroidProguardRules` always appends new rules by default.
  // That is not ideal if we leave generated contents from previous prebuilding there.
  // The `withAndroidPurgeProguardRulesOnce` is for this purpose and it would only run once in prebuilding phase.
  config = withAndroidProguardRules(config, pluginConfig);
  config = withAndroidPurgeProguardRulesOnce(config); // plugins order matter: the later one would run first

  config = withIosBuildProperties(config, pluginConfig);
  config = withIosDeploymentTarget(config, pluginConfig);

  return config;
};

export default withBuildProperties;
