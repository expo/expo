import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withStaticPlugin,
} from '@expo/config-plugins';

// Local unversioned updates plugin

const packageName = 'expo-updates';

export const withExpoUpdates: ConfigPlugin<{ expoUsername: string }> = (config, props) => {
  return withStaticPlugin(config, {
    _isLegacyPlugin: true,
    // Pass props to the static plugin if it exists.
    plugin: [packageName, props],
    // If the static plugin isn't found, use the unversioned one.
    fallback: createRunOncePlugin(config => withUnversionedUpdates(config, props), packageName),
  });
};

const withUnversionedUpdates: ConfigPlugin<{ expoUsername: string }> = (config, props) => {
  config = AndroidConfig.Updates.withUpdates(config, props);
  config = IOSConfig.Updates.withUpdates(config, props);
  return config;
};

export default withExpoUpdates;
