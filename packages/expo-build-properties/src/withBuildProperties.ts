import { createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

import { withAndroidBuildProperties, withAndroidProguardRules } from './android';
import { withIosBuildProperties, withIosDeploymentTarget } from './ios';
import { validateConfig } from './pluginConfig';

const pkg = require('expo-build-properties/package.json');

/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 */
const withBuildProperties: ConfigPlugin<any> = (config, props) => {
  const pluginConfig = validateConfig(props || {});

  config = withAndroidBuildProperties(config, pluginConfig);
  config = withAndroidProguardRules(config, pluginConfig);
  config = withIosBuildProperties(config, pluginConfig);
  config = withIosDeploymentTarget(config, pluginConfig);

  return config;
};

export default createRunOncePlugin(withBuildProperties, pkg.name, pkg.version);
