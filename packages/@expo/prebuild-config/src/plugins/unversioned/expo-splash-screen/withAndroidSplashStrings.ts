import { AndroidConfig, ConfigPlugin, withStringsXml } from '@expo/config-plugins';

import { AndroidSplashConfig, getAndroidSplashConfig } from './getAndroidSplashConfig';

const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';

export const withAndroidSplashStrings: ConfigPlugin<AndroidSplashConfig> = (config, props) => {
  return withStringsXml(config, (config) => {
    const splashConfig = getAndroidSplashConfig(config, props);
    if (splashConfig) {
      const { resizeMode } = splashConfig;
      config.modResults = setSplashStrings(config.modResults, resizeMode);
    }
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
