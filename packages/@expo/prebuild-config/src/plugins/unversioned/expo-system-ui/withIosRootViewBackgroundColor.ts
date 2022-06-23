import { ConfigPlugin, InfoPlist, WarningAggregator, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
// @ts-ignore: uses flow
import normalizeColor from '@react-native/normalize-color';
import semver from 'semver';

// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';

const debug = require('debug')('expo:system-ui:plugin:ios');

export const withIosRootViewBackgroundColor: ConfigPlugin = config => {
  config = withInfoPlist(config, config => {
    if (shouldUseLegacyBehavior(config)) {
      config.modResults = setRootViewBackgroundColor(config, config.modResults);
    } else {
      warnSystemUIMissing(config);
    }
    return config;
  });
  return config;
};

/** The template was changed in SDK 43 to move the background color logic to the `expo-system-ui` module */
export function shouldUseLegacyBehavior(config: Pick<ExpoConfig, 'sdkVersion'>): boolean {
  try {
    return !!(config.sdkVersion && semver.lt(config.sdkVersion, '44.0.0'));
  } catch {}
  return false;
}

export function warnSystemUIMissing(
  config: Pick<ExpoConfig, 'sdkVersion' | 'backgroundColor' | 'ios'>
) {
  const backgroundColor = getRootViewBackgroundColor(config);

  if (backgroundColor) {
    // Background color needs to be set programmatically
    WarningAggregator.addWarningIOS(
      'ios.backgroundColor',
      'Install expo-system-ui to enable this feature',
      'https://docs.expo.dev/build-reference/migrating/#expo-config--backgroundcolor--depends-on'
    );
  }
}

export function setRootViewBackgroundColor(
  config: Pick<ExpoConfig, 'backgroundColor' | 'ios'>,
  infoPlist: InfoPlist
): InfoPlist {
  const backgroundColor = getRootViewBackgroundColor(config);
  if (!backgroundColor) {
    delete infoPlist[BACKGROUND_COLOR_KEY];
  } else {
    let color = normalizeColor(backgroundColor);
    if (!color) {
      throw new Error('Invalid background color on iOS');
    }
    color = ((color << 24) | (color >>> 8)) >>> 0;
    infoPlist[BACKGROUND_COLOR_KEY] = color;

    debug(`Convert color: ${backgroundColor} -> ${color}`);
  }
  return infoPlist;
}

export function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'ios' | 'backgroundColor'>) {
  return config.ios?.backgroundColor || config.backgroundColor || null;
}
