import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { AndroidSplashConfig, getAndroidSplashConfig } from './getAndroidSplashConfig';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashMainActivity } from './withAndroidSplashMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';

export const withAndroidSplashScreen: ConfigPlugin<
  AndroidSplashConfig | undefined | null | void
> = (config, props) => {
  const isLegacyConfig = props === undefined;
  const splashConfig = getAndroidSplashConfig(config, props ?? null);

  return withPlugins(config, [
    [withAndroidSplashMainActivity, { isLegacyConfig }],
    [withAndroidSplashImages, splashConfig],
    [withAndroidSplashDrawables, splashConfig],
    [withAndroidSplashStyles, { splashConfig, isLegacyConfig }],
    [withAndroidSplashStrings, splashConfig],
  ]);
};
