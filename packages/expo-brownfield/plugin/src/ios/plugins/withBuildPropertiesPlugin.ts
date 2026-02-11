import type { ConfigPlugin } from 'expo/config-plugins';
import withBuildProperties from 'expo-build-properties';

const withBuildPropertiesPlugin: ConfigPlugin = (config) => {
  return withBuildProperties(config, {
    ios: { buildReactNativeFromSource: true },
  });
};

export default withBuildPropertiesPlugin;
