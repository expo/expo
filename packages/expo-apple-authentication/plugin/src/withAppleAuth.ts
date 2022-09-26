import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withAppleAuthIOS } from './withAppleAuthIOS';

const pkg = require('expo-apple-authentication/package.json');

const withAppleAuth: ConfigPlugin = (config) => {
  config = withAppleAuthIOS(config);
  return config;
};

export default createRunOncePlugin(withAppleAuth, pkg.name, pkg.version);
