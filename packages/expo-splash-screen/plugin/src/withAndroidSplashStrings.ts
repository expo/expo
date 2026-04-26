import { AndroidConfig, ConfigPlugin, withStringsXml } from 'expo/config-plugins';

import { AndroidSplashConfig } from './types';

const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';

export const withAndroidSplashStrings: ConfigPlugin<AndroidSplashConfig> = (config, splash) => {
  return withStringsXml(config, (config) => {
    config.modResults = setSplashStrings(config.modResults, splash.resizeMode);
    return config;
  });
};

export function setSplashStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  resizeMode: string
): AndroidConfig.Resources.ResourceXML {
  return AndroidConfig.Strings.setStringItem(
    [
      AndroidConfig.Resources.buildResourceItem({
        name: RESIZE_MODE_KEY,
        value: resizeMode,
        translatable: false,
      }),
    ],
    strings
  );
}
