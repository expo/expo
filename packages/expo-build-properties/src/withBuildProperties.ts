import { ConfigPlugin } from 'expo/config-plugins';

import {
  withAndroidBuildProperties,
  withAndroidProguardRules,
  withAndroidPurgeProguardRulesOnce,
  withAndroidCleartextTraffic,
  withAndroidQueries,
  withAndroidDayNightTheme,
  withAndroidSettingsGradle,
} from './android';
import { withIosBuildProperties, withIosDeploymentTarget } from './ios';
import { PluginConfigType, validateConfig } from './pluginConfig';

/**
 * Config plugin allowing customizing native Android and iOS build properties for managed apps.
 * @param config Expo config for application.
 * @param props Configuration for the build properties plugin.
 */
export const withBuildProperties: ConfigPlugin<PluginConfigType> = (config, props) => {
  const pluginConfig = validateConfig(props || {});

  config = withAndroidBuildProperties(config, pluginConfig);

  config = withAndroidProguardRules(config, pluginConfig);
  config = withAndroidCleartextTraffic(config, pluginConfig);
  config = withAndroidSettingsGradle(config, pluginConfig);
  config = withAndroidQueries(config, pluginConfig);
  // Assuming `withBuildProperties` could be called multiple times from different config-plugins,
  // the `withAndroidProguardRules` always appends new rules by default.
  // That is not ideal if we leave generated contents from previous prebuild there.
  // The `withAndroidPurgeProguardRulesOnce` is for this purpose and it would only run once in prebuilding phase.
  //
  // plugins order matter: the later one would run first
  config = withAndroidPurgeProguardRulesOnce(config);
  config = withAndroidDayNightTheme(config, pluginConfig);

  config = withIosBuildProperties(config, pluginConfig);
  config = withIosDeploymentTarget(config, pluginConfig);

  return config;
};

export default withBuildProperties;
