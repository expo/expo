// @ts-ignore: uses flow
import normalizeColor from '@react-native/normalize-color';
import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist, withInfoPlist } from 'expo/config-plugins';

// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';

const debug = require('debug')('expo:system-ui:plugin:ios');

export const withIosRootViewBackgroundColor: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults = setRootViewBackgroundColor(config, config.modResults);
    return config;
  });
  return config;
};

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
