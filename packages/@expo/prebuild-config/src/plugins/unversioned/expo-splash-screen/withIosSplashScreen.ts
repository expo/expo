import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import Debug from 'debug';

import {
  getIosSplashConfig,
  IOSSplashConfig,
  warnUnsupportedSplashProperties,
} from './getIosSplashConfig';
import { withIosSplashAssets } from './withIosSplashAssets';
import { withIosSplashInfoPlist } from './withIosSplashInfoPlist';
import { withIosSplashScreenStoryboardBaseMod } from './withIosSplashScreenStoryboard';
import { withIosSplashXcodeProject } from './withIosSplashXcodeProject';
import { withIosSplashScreenImage } from './wtihIosSplashScreenStoryboardImage';

const debug = Debug('expo:prebuild-config:expo-splash-screen:ios');

export const withIosSplashScreen: ConfigPlugin<IOSSplashConfig | undefined | null | void> = (
  config,
  splash
) => {
  // only warn once
  warnUnsupportedSplashProperties(config);

  // If the user didn't specify a splash object, infer the splash object from the Expo config.
  if (!splash) {
    splash = getIosSplashConfig(config);
  } else {
    debug(`custom splash config provided`);
  }

  debug(`config:`, splash);

  return withPlugins(config, [
    [withIosSplashInfoPlist, splash],
    [withIosSplashAssets, splash],
    // Add the image settings to the storyboard.
    [withIosSplashScreenImage, splash],
    // Link storyboard to xcode project.
    // TODO: Maybe fold this into the base mod.
    withIosSplashXcodeProject,
    // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
    withIosSplashScreenStoryboardBaseMod,
  ]);
};
