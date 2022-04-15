import { createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

import { withAndroidBuildProperties, withAndroidProguardRules } from './android';
import { validateConfig } from './pluginConfig';

const pkg = require('expo-build-properties/package.json');

const withBuildProperties: ConfigPlugin<any> = (config, props) => {
  const pluginConfig = validateConfig(props || {});

  config = withAndroidBuildProperties(config, pluginConfig);
  config = withAndroidProguardRules(config, pluginConfig);

  return config;
};

export default createRunOncePlugin(withBuildProperties, pkg.name, pkg.version);
