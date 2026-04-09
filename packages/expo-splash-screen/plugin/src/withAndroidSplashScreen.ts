import { ConfigPlugin, withPlugins } from 'expo/config-plugins';

import { AndroidSplashConfig, getAndroidSplashConfig } from './getAndroidSplashConfig';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashMainActivity } from './withAndroidSplashMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';

export const withAndroidSplashScreen: ConfigPlugin<AndroidSplashConfig> = (config, props) => {
  const splashConfig = getAndroidSplashConfig(props);

  return withPlugins(config, [
    withAndroidSplashMainActivity,
    [withAndroidSplashImages, splashConfig],
    [withAndroidSplashDrawables, splashConfig],
    [withAndroidSplashStyles, splashConfig],
    [withAndroidSplashStrings, splashConfig],
  ]);
};
