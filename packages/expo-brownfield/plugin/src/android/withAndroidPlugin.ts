import type { ConfigPlugin } from 'expo/config-plugins';

import {
  withDebugBundlePlugin,
  withGradlePropertiesPlugin,
  withProjectBuildGradlePlugin,
  withProjectFilesPlugin,
  withSettingsGradlePlugin,
} from './plugins';
import type { PluginProps } from './types';
import { getPluginConfig } from './utils';

const withAndroidPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  const pluginConfig = getPluginConfig(props, config);

  config = withProjectFilesPlugin(config, pluginConfig);
  config = withSettingsGradlePlugin(config, pluginConfig);
  config = withProjectBuildGradlePlugin(config, pluginConfig);
  config = withGradlePropertiesPlugin(config, pluginConfig);
  config = withDebugBundlePlugin(config, pluginConfig);

  return config;
};

export default withAndroidPlugin;
