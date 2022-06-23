import { ConfigPlugin, WarningAggregator, withPlugins } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import { getAndroidSplashConfig } from './getAndroidSplashConfig';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashLegacyMainActivity } from './withAndroidSplashLegacyMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';

export const withAndroidSplashScreen: ConfigPlugin = config => {
  const splashConfig = getAndroidSplashConfig(config);

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
    withAndroidSplashImages,
    [withAndroidSplashDrawables, splashConfig],
    ...(shouldUpdateLegacyMainActivity(config) ? [withAndroidSplashLegacyMainActivity] : []),
    withAndroidSplashStyles,
    withAndroidSplashStrings,
  ]);
};

function shouldUpdateLegacyMainActivity(config: ExpoConfig): boolean {
  try {
    const projectRoot = config._internal?.projectRoot;
    const packagePath = resolveFrom(projectRoot, 'expo-splash-screen/package.json');
    if (packagePath) {
      const version = JsonFile.read(packagePath).version?.toString() ?? '';
      return semver.lt(version, '0.12.0');
    }
    // If expo-splash-screen didn't be installed or included in template, we check the sdkVersion instead.
    return !!(config.sdkVersion && semver.lt(config.sdkVersion, '43.0.0'));
  } catch {}
  return false;
}
