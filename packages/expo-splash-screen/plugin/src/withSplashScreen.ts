import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { getAndroidSplashConfig } from './getAndroidSplashConfig';
import { getIosSplashConfig } from './getIosSplashConfig';
import { AndroidSplashConfig, IOSSplashConfig, Props } from './types';
import { withAndroidSplashDrawables } from './withAndroidSplashDrawables';
import { withAndroidSplashImages } from './withAndroidSplashImages';
import { withAndroidSplashMainActivity } from './withAndroidSplashMainActivity';
import { withAndroidSplashStrings } from './withAndroidSplashStrings';
import { withAndroidSplashStyles } from './withAndroidSplashStyles';
import { withIosSplashAssets } from './withIosSplashAssets';
import { withIosSplashColors } from './withIosSplashColors';
import { withIosSplashInfoPlist } from './withIosSplashInfoPlist';
import { withIosSplashScreenStoryboardBaseMod } from './withIosSplashScreenStoryboard';
import { withIosSplashScreenImage } from './withIosSplashScreenStoryboardImage';
import { withIosSplashXcodeProject } from './withIosSplashXcodeProject';

const pkg = require('../../package.json');

export const withAndroidSplashScreen: ConfigPlugin<AndroidSplashConfig> = (config, splash) =>
  withPlugins(config, [
    withAndroidSplashMainActivity,
    [withAndroidSplashImages, splash],
    [withAndroidSplashDrawables, splash],
    [withAndroidSplashStyles, splash],
    [withAndroidSplashStrings, splash],
  ]);

export const withIosSplashScreen: ConfigPlugin<IOSSplashConfig> = (config, splash) =>
  withPlugins(config, [
    [withIosSplashInfoPlist, splash],
    [withIosSplashAssets, splash],
    [withIosSplashColors, splash],
    [withIosSplashScreenImage, splash],
    withIosSplashXcodeProject,
    // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
    withIosSplashScreenStoryboardBaseMod,
  ]);

const withSplashScreen: ConfigPlugin<Props | null> = (config, props) => {
  if (props == null) {
    return config;
  }

  const configs = {
    android: getAndroidSplashConfig(props),
    ios: getIosSplashConfig(props),
  };

  // Elevate configs to a static value on extra so Expo Go can read it.
  config.extra ??= {};
  config.extra[pkg.name] = configs;

  config = withAndroidSplashScreen(config, configs.android);
  config = withIosSplashScreen(config, configs.ios);

  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
