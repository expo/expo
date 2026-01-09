import { type ConfigPlugin, withPodfileProperties } from 'expo/config-plugins';

const withPodfilePropertiesPlugin: ConfigPlugin = (config) => {
  return withPodfileProperties(config, (config) => {
    config.modResults['ios.useFrameworks'] = 'static';
    return config;
  });
};

export default withPodfilePropertiesPlugin;
