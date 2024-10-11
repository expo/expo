import { ConfigPlugin, WarningAggregator, withPlugins } from '@expo/config-plugins';

import { AndroidSplashConfig, getAndroidSplashConfig } from './getAndroidSplashConfig';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashMainActivity } from './withAndroidSplashMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';

export const withAndroidSplashScreen: ConfigPlugin<AndroidSplashConfig> = (config, props) => {
  const splashConfig = getAndroidSplashConfig(config, props);

  // Update the android status bar to match the splash screen
  // androidStatusBar applies info to the app activity style.
  const backgroundColor = splashConfig?.backgroundColor || '#ffffff';
  if (config.androidStatusBar?.backgroundColor) {
    if (
      backgroundColor.toLowerCase() !== config.androidStatusBar?.backgroundColor?.toLowerCase?.()
    ) {
      WarningAggregator.addWarningAndroid(
        'androidStatusBar.backgroundColor',
        'Color conflicts with the splash.backgroundColor'
      );
    }
  } else {
    if (!config.androidStatusBar) config.androidStatusBar = {};
    config.androidStatusBar.backgroundColor = backgroundColor;
  }

  return withPlugins(config, [
    [withAndroidSplashMainActivity, props],
    [withAndroidSplashImages, props],
    [withAndroidSplashDrawables, splashConfig],
    [withAndroidSplashStyles, props],
    [withAndroidSplashStrings, props],
  ]);
};
