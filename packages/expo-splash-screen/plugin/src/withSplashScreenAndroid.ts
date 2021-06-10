import { ConfigPlugin, WarningAggregator, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import {
  AndroidSplashScreenConfig,
  configureAndroidSplashScreen,
  SplashScreenImageResizeMode,
} from '@expo/configure-splash-screen';

export const withSplashScreenAndroid: ConfigPlugin = config => {
  // Update the android status bar to match the splash screen
  // androidStatusBar applies info to the app activity style.
  const backgroundColor = getSplashBackgroundColor(config);

  if (config.androidStatusBar?.backgroundColor) {
    if (backgroundColor.toLowerCase() !== config.androidStatusBar?.backgroundColor.toLowerCase()) {
      WarningAggregator.addWarningAndroid(
        'androidStatusBar.backgroundColor',
        'The androidStatusBar.backgroundColor color conflicts with the splash backgroundColor on Android'
      );
    }
  } else {
    if (!config.androidStatusBar) config.androidStatusBar = {};
    config.androidStatusBar.backgroundColor = backgroundColor;
  }
  return withDangerousMod(config, [
    'android',
    async config => {
      await setSplashScreenAsync(config, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

function getSplashBackgroundColor(config: ExpoConfig) {
  const backgroundColor =
    config.android?.splash?.backgroundColor ?? config.splash?.backgroundColor ?? '#FFFFFF'; // white
  return backgroundColor;
}

export function getSplashScreenConfig(config: ExpoConfig): AndroidSplashScreenConfig | undefined {
  if (!config.splash && !config.android?.splash) {
    return;
  }

  const backgroundColor = getSplashBackgroundColor(config);

  const result: AndroidSplashScreenConfig = {
    imageResizeMode:
      config.android?.splash?.resizeMode ??
      config.splash?.resizeMode ??
      SplashScreenImageResizeMode.CONTAIN,
    backgroundColor,
    image:
      config.android?.splash?.xxxhdpi ??
      config.android?.splash?.xxhdpi ??
      config.android?.splash?.xhdpi ??
      config.android?.splash?.hdpi ??
      config.android?.splash?.mdpi ??
      config.splash?.image,
    statusBar: {
      backgroundColor,
      // Use the settings from androidStatusBar to keep the transition as smooth as possible.
      hidden: config.androidStatusBar?.hidden,
      translucent: config.androidStatusBar?.translucent,
      style: config.androidStatusBar?.barStyle,
    },
  };

  return result;
}

export async function setSplashScreenAsync(config: ExpoConfig, projectRoot: string) {
  const splashConfig = getSplashScreenConfig(config);
  if (!splashConfig) {
    return;
  }

  try {
    await configureAndroidSplashScreen(projectRoot, splashConfig);
  } catch (e) {
    // TODO: Throw errors in EXPO_DEBUG
    WarningAggregator.addWarningAndroid('splash', e);
  }
}
