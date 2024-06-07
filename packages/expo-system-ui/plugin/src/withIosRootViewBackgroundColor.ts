import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist, convertColor, withInfoPlist } from 'expo/config-plugins';

// Maps to the template AppDelegate.m
const BACKGROUND_COLOR_KEY = 'RCTRootViewBackgroundColor';

const debug = require('debug')('expo:system-ui:plugin:ios');

export const withIosRootViewBackgroundColor: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults = setRootViewBackgroundColor(
      config.modRequest.projectRoot,
      config,
      config.modResults
    );
    return config;
  });
  return config;
};

export function setRootViewBackgroundColor(
  projectRoot: string,
  config: Pick<ExpoConfig, 'backgroundColor' | 'ios'>,
  infoPlist: InfoPlist
): InfoPlist {
  const backgroundColor = getRootViewBackgroundColor(config);
  if (!backgroundColor) {
    delete infoPlist[BACKGROUND_COLOR_KEY];
  } else {
    const color = convertColor(projectRoot, backgroundColor);
    infoPlist[BACKGROUND_COLOR_KEY] = color;

    debug(`Convert color: ${backgroundColor} -> ${color}`);
  }
  return infoPlist;
}

export function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'ios' | 'backgroundColor'>) {
  return config.ios?.backgroundColor || config.backgroundColor || null;
}
