import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { Props } from './types';
import { withAndroidSplashScreen } from './withAndroidSplashScreen';
import { withIosSplashScreen } from './withIosSplashScreen';

const pkg = require('../../package.json');

const withSplashScreen: ConfigPlugin<Props | null> = (config, props) => {
  if (props != null) {
    config = withAndroidSplashScreen(config, props);
    config = withIosSplashScreen(config, props);
  }

  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
