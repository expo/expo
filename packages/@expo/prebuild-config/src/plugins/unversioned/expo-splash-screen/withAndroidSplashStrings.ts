import { AndroidConfig, ConfigPlugin, withStringsXml } from '@expo/config-plugins';

import { getAndroidSplashConfig } from './getAndroidSplashConfig';

const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';
const STATUS_BAR_TRANSLUCENT_KEY = 'expo_splash_screen_status_bar_translucent';
const FADE_TIME_KEY = 'expo_splash_screen_fade_time';

export const withAndroidSplashStrings: ConfigPlugin = (config) => {
  return withStringsXml(config, (config) => {
    const splashConfig = getAndroidSplashConfig(config);
    if (splashConfig) {
      const { resizeMode } = splashConfig;
      const statusBarTranslucent = !!config.androidStatusBar?.translucent;
      const fadeTime = `${splashConfig.fadeTime}`;
      config.modResults = setSplashStrings(
        config.modResults,
        resizeMode,
        statusBarTranslucent,
        fadeTime
      );
    }
    return config;
  });
};

export function setSplashStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  resizeMode: string,
  statusBarTranslucent: boolean,
  fadeTime: string
): AndroidConfig.Resources.ResourceXML {
  return AndroidConfig.Strings.setStringItem(
    [
      AndroidConfig.Resources.buildResourceItem({
        name: RESIZE_MODE_KEY,
        value: resizeMode,
        translatable: false,
      }),
      AndroidConfig.Resources.buildResourceItem({
        name: STATUS_BAR_TRANSLUCENT_KEY,
        value: String(statusBarTranslucent),
        translatable: false,
      }),
      AndroidConfig.Resources.buildResourceItem({
        name: FADE_TIME_KEY,
        value: String(fadeTime),
        translatable: false,
      }),
    ],
    strings
  );
}
