import { ConfigPlugin, withPlugins } from 'expo/config-plugins';

import { getAndroidSplashConfig } from './getAndroidSplashConfig';
import { Props } from './types';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashMainActivity } from './withAndroidSplashMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';

export const withAndroidSplashScreen: ConfigPlugin<Props> = (config, props) => {
  const splash = getAndroidSplashConfig(props);

  return withPlugins(config, [
    withAndroidSplashMainActivity,
    [withAndroidSplashImages, splash],
    [withAndroidSplashDrawables, splash],
    [withAndroidSplashStyles, splash],
    [withAndroidSplashStrings, splash],
  ]);
};
