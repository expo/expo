import { ConfigPlugin, withPlugins } from 'expo/config-plugins';

import { getIosSplashConfig } from './getIosSplashConfig';
import { Props } from './types';
import { withIosSplashAssets } from './withIosSplashAssets';
import { withIosSplashColors } from './withIosSplashColors';
import { withIosSplashInfoPlist } from './withIosSplashInfoPlist';
import { withIosSplashScreenStoryboardBaseMod } from './withIosSplashScreenStoryboard';
import { withIosSplashScreenImage } from './withIosSplashScreenStoryboardImage';
import { withIosSplashXcodeProject } from './withIosSplashXcodeProject';

export const withIosSplashScreen: ConfigPlugin<Props> = (config, props) => {
  const splash = getIosSplashConfig(props);

  return withPlugins(config, [
    [withIosSplashInfoPlist, splash],
    [withIosSplashAssets, splash],
    [withIosSplashColors, splash],
    // Add the image settings to the storyboard.
    [withIosSplashScreenImage, splash],
    // Link storyboard to xcode project.
    // TODO: Maybe fold this into the base mod.
    withIosSplashXcodeProject,
    // Insert the base mod last, no other ios.splashScreenStoryboard mods can be added after this.
    withIosSplashScreenStoryboardBaseMod,
  ]);
};
