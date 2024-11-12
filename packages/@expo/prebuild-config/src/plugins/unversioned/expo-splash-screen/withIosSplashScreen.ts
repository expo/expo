import { ConfigPlugin, withPlugins } from '@expo/config-plugins';
import Debug from 'debug';

import { getIosSplashConfig, IOSSplashConfig } from './getIosSplashConfig';
import { withIosSplashAssets } from './withIosSplashAssets';
import { withIosSplashColors } from './withIosSplashColors';
import { withIosSplashInfoPlist } from './withIosSplashInfoPlist';
import { withIosSplashScreenStoryboardBaseMod } from './withIosSplashScreenStoryboard';
import { withIosSplashScreenImage } from './withIosSplashScreenStoryboardImage';
import { withIosSplashXcodeProject } from './withIosSplashXcodeProject';

const debug = Debug('expo:prebuild-config:expo-splash-screen:ios');

export const withIosSplashScreen: ConfigPlugin<IOSSplashConfig | undefined | null | void> = (
  config,
  props
) => {
  // If the user didn't specify a splash object, infer the splash object from the Expo config.
  const splashConfig = getIosSplashConfig(config, props ?? null);

  debug(`config:`, props);

  return withPlugins(config, [
    [withIosSplashInfoPlist, splashConfig],
    [withIosSplashAssets, splashConfig],
    [withIosSplashColors, splashConfig],
    // Add the image settings to the storyboard.
    [withIosSplashScreenImage, splashConfig],
    // Link storyboard to xcode project.
    // TODO: Maybe fold this into the base mod.
    withIosSplashXcodeProject,
    // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
    withIosSplashScreenStoryboardBaseMod,
  ]);
};
