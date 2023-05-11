import { ConfigPlugin, InfoPlist, WarningAggregator, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import Debug from 'debug';

import { IOSSplashConfig } from './getIosSplashConfig';

const debug = Debug('expo:prebuild-config:expo-splash-screen:ios:infoPlist');

export const withIosSplashInfoPlist: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
  return withInfoPlist(config, (config) => {
    config.modResults = setSplashInfoPlist(config, config.modResults, splash);
    return config;
  });
};

export function setSplashInfoPlist(
  config: ExpoConfig,
  infoPlist: InfoPlist,
  splash: IOSSplashConfig
): InfoPlist {
  infoPlist['EXSplashScreenFadeTime'] = splash.fadeTime;
  const isDarkModeEnabled = !!(
    splash?.dark?.image ||
    splash?.dark?.tabletImage ||
    splash?.dark?.backgroundColor ||
    splash?.dark?.tabletBackgroundColor
  );
  debug(`isDarkModeEnabled: `, isDarkModeEnabled);

  if (isDarkModeEnabled) {
    // IOSConfig.UserInterfaceStyle.getUserInterfaceStyle(config);
    // Determine if the user manually defined the userInterfaceStyle incorrectly
    const existing = config.ios?.userInterfaceStyle ?? config.userInterfaceStyle;
    // Add a warning to prevent the dark mode splash screen from not being shown -- this was learned the hard way.
    if (existing && existing !== 'automatic') {
      WarningAggregator.addWarningIOS(
        'userInterfaceStyle',
        'The existing `userInterfaceStyle` property is preventing splash screen from working properly. Please remove it or disable dark mode splash screens.'
      );
    }
    // assigning it to auto anyways, but this is fragile because the order of operations matter now
    infoPlist.UIUserInterfaceStyle = 'Automatic';
  } else {
    // NOTE(brentvatne): Commented out this line because it causes https://github.com/expo/expo-cli/issues/3935
    // We should revisit this approach.
    // delete infoPlist.UIUserInterfaceStyle;
  }

  if (splash) {
    // TODO: What to do here ??
    infoPlist.UILaunchStoryboardName = 'SplashScreen';
  } else {
    debug(`Disabling UILaunchStoryboardName`);
    delete infoPlist.UILaunchStoryboardName;
  }

  return infoPlist;
}
