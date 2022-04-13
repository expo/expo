import { createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import { withAndroidBuildProperties } from './android';
import type { BuildPropertiesPluginConfig } from './BuildPropertiesConfig.types';

const pkg = require('expo-build-properties/package.json');

const withBuildProperties: ConfigPlugin<BuildPropertiesPluginConfig | void> = (config, props) => {
  const _props = props || {};

  config = withAndroidBuildProperties(config, _props);

  return config;
};

export default createRunOncePlugin(withBuildProperties, pkg.name, pkg.version);
