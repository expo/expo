import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withSplashScreenAndroid } from './withSplashScreenAndroid';
import { withSplashScreenIOS } from './withSplashScreenIOS';

const pkg = require('expo-splash-screen/package.json');

const withSplashScreen: ConfigPlugin = config => {
  config = withSplashScreenAndroid(config);
  config = withSplashScreenIOS(config);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
