import { ConfigPlugin, createRunOncePlugin, AndroidConfig, IOSConfig } from 'expo/config-plugins';

const pkg = require('expo-updates/package.json');

// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools

const withUpdates: ConfigPlugin = (config) => {
  config = AndroidConfig.Updates.withUpdates(config);
  config = IOSConfig.Updates.withUpdates(config);
  return config;
};

export default createRunOncePlugin(withUpdates, pkg.name, pkg.version);
