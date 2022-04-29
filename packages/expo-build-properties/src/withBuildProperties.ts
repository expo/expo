import type { ConfigPlugin } from '@expo/config-plugins';

import { withAndroidBuildProperties, withAndroidProguardRules } from './android';
import { withIosBuildProperties, withIosDeploymentTarget } from './ios';
import { PluginConfigType, validateConfig } from './pluginConfig';

/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 *
 * @param config ExpoConfig
 * @param props Configuration for the config plugin
 * @ignore
 */
export const withBuildProperties: ConfigPlugin<PluginConfigType> = (config, props) => {
  const pluginConfig = validateConfig(props || {});

  config = withAndroidBuildProperties(config, pluginConfig);
  config = withAndroidProguardRules(config, pluginConfig);
  config = withIosBuildProperties(config, pluginConfig);
  config = withIosDeploymentTarget(config, pluginConfig);

  return config;
};

export default withBuildProperties;
