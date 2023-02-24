import { getAccountUsername } from '@expo/config';
import { ConfigPlugin, createRunOncePlugin, AndroidConfig, IOSConfig } from 'expo/config-plugins';

const pkg = require('expo-updates/package.json');

const withUpdates: ConfigPlugin<{ expoUsername?: string } | void> = (config, props = {}) => {
  // The username will be passed from the CLI when the plugin is automatically used.
  const expoUsername = (props || {}).expoUsername ?? getAccountUsername(config);

  config = AndroidConfig.Updates.withUpdates(config, { expoUsername });
  config = IOSConfig.Updates.withUpdates(config, { expoUsername });
  return config;
};

export default createRunOncePlugin(withUpdates, pkg.name, pkg.version);
