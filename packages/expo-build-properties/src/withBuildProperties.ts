import { createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

import { withAndroidBuildProperties, withAndroidProguardRules } from './android';
import { withIosBuildProperties, withIosDeploymentTarget } from './ios';
import { PluginConfigType, validateConfig } from './pluginConfig';

const pkg = require('expo-build-properties/package.json');

/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 * @param config ExpoConfig
 * @param props `PluginConfig` from app.json or app.config.js
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

export default createRunOncePlugin(withBuildProperties, pkg.name, pkg.version);
