import {
  AndroidConfig,
  ConfigPlugin,
  WarningAggregator,
  withStringsXml,
} from '@expo/config-plugins';

import {
  minFadeDurationMs,
  maxFadeDurationMs,
  computeFadeDurationMs,
  defaultFadeDurationMs,
} from './fadeDurationUtils';
import { getAndroidSplashConfig } from './getAndroidSplashConfig';

const RESIZE_MODE_KEY = 'expo_splash_screen_resize_mode';
const STATUS_BAR_TRANSLUCENT_KEY = 'expo_splash_screen_status_bar_translucent';
const FADE_DURATION_MS_KEY = 'expo_splash_screen_fade_duration_ms';

interface ExtraProps {
  resizeMode?: string;
  fadeDurationMs?: number;
}

const defaultResizeMode = 'contain';

export const withAndroidSplashStrings: ConfigPlugin<ExtraProps> = (config, splash) => {
  return withStringsXml(config, (config) => {
    const splashConfig = getAndroidSplashConfig(config);
    if (splashConfig) {
      const resizeMode = splash?.resizeMode ?? splashConfig?.resizeMode ?? defaultResizeMode;
      const statusBarTranslucent = !!config.androidStatusBar?.translucent;
      let duration;
      if (splash?.fadeDurationMs) {
        duration = computeFadeDurationMs(splash?.fadeDurationMs);
        if (duration !== splash?.fadeDurationMs) {
          WarningAggregator.addWarningAndroid(
            'fadeDurationMs',
            `The fade duration value must be between ${minFadeDurationMs} and ${maxFadeDurationMs}. Using ${duration}.`
          );
        }
      } else if (splashConfig?.fadeDurationMs) {
        duration = computeFadeDurationMs(splashConfig?.fadeDurationMs);
        if (duration !== splashConfig?.fadeDurationMs) {
          WarningAggregator.addWarningAndroid(
            'fadeDurationMs',
            `The fade duration value must be between ${minFadeDurationMs} and ${maxFadeDurationMs}. Using ${duration}.`
          );
        }
      } else {
        duration = defaultFadeDurationMs;
      }
      config.modResults = setSplashStrings(
        config.modResults,
        resizeMode,
        statusBarTranslucent,
        `${duration}`
      );
    }
    return config;
  });
};

export function setSplashStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  resizeMode: string,
  statusBarTranslucent: boolean,
  fadeDurationMs: string
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
        name: FADE_DURATION_MS_KEY,
        value: String(fadeDurationMs),
        translatable: false,
      }),
    ],
    strings
  );
}
