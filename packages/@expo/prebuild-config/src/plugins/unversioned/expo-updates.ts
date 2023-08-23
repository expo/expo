import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withStaticPlugin,
} from '@expo/config-plugins';

// Local unversioned updates plugin

const packageName = 'expo-updates';

export const withExpoUpdates: ConfigPlugin = (config) => {
  return withStaticPlugin(config, {
    _isLegacyPlugin: true,
    // Pass props to the static plugin if it exists.
    plugin: packageName,
    // If the static plugin isn't found, use the unversioned one.
    fallback: createRunOncePlugin((config) => withUnversionedUpdates(config), packageName),
  });
};

const withUnversionedUpdates: ConfigPlugin = (config) => {
  config = AndroidConfig.Updates.withUpdates(config);
  config = IOSConfig.Updates.withUpdates(config);
  return config;
};

export default withExpoUpdates;
