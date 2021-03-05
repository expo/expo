import { ConfigPlugin, WarningAggregator, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import {
  AndroidSplashScreenConfig,
  configureAndroidSplashScreen,
  SplashScreenImageResizeMode,
} from '@expo/configure-splash-screen';

export const withSplashScreenAndroid: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'android',
    async config => {
      await setSplashScreenAsync(config, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

export function getSplashScreenConfig(config: ExpoConfig): AndroidSplashScreenConfig | undefined {
  if (!config.splash && !config.android?.splash) {
    return;
  }

  const result: AndroidSplashScreenConfig = {
    imageResizeMode:
      config.android?.splash?.resizeMode ??
      config.splash?.resizeMode ??
      SplashScreenImageResizeMode.CONTAIN,
    backgroundColor:
      config.android?.splash?.backgroundColor ?? config.splash?.backgroundColor ?? '#FFFFFF', // white
    image:
      config.android?.splash?.xxxhdpi ??
      config.android?.splash?.xxhdpi ??
      config.android?.splash?.xhdpi ??
      config.android?.splash?.hdpi ??
      config.android?.splash?.mdpi ??
      config.splash?.image,
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
