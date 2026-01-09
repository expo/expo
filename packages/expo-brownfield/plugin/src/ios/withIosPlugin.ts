import type { ConfigPlugin } from 'expo/config-plugins';

import {
  withBuildPropertiesPlugin,
  withPodfilePlugin,
  withPodfilePropertiesPlugin,
  withXcodeProjectPlugin,
} from './plugins';
import type { PluginProps } from './types';
import { getPluginConfig } from './utils';

const withIosPlugin: ConfigPlugin<PluginProps> = (config, props) => {
  const pluginConfig = getPluginConfig(props, config);

  config = withXcodeProjectPlugin(config, pluginConfig);
  config = withPodfilePlugin(config, pluginConfig);
  config = withPodfilePropertiesPlugin(config);
  config = withBuildPropertiesPlugin(config);

  return config;
};

export default withIosPlugin;
