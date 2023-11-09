import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withAndroidSplashScreen } from './android/withAndroidSplashScreen';
import { withIosSplashScreen } from './ios/withIosSplashScreen';

const pkg = require('expo-splash-screen/package.json');

const withSplashScreen: ConfigPlugin = (config) => {
  // For simplicity, we'll version the unversioned code in expo-splash-screen.
  // This adds more JS to the package overall, but the trade-off is less copying between expo-cli/expo.
  config = withAndroidSplashScreen(config);
  config = withIosSplashScreen(config);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
