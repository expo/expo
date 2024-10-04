import { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidColors,
  withAndroidStyles,
} from 'expo/config-plugins';

const { assignColorValue } = AndroidConfig.Colors;
const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;

const ANDROID_WINDOW_BACKGROUND = 'android:windowBackground';
const WINDOW_BACKGROUND_COLOR = 'activityBackground';

export const withAndroidRootViewBackgroundColor: ConfigPlugin = (config) => {
  config = withRootViewBackgroundColorColors(config);
  config = withRootViewBackgroundColorStyles(config);
  return config;
};

export const withRootViewBackgroundColorColors: ConfigPlugin = (config) => {
  return withAndroidColors(config, async (config) => {
    config.modResults = assignColorValue(config.modResults, {
      value: getRootViewBackgroundColor(config),
      name: WINDOW_BACKGROUND_COLOR,
    });
    return config;
  });
};

export const withRootViewBackgroundColorStyles: ConfigPlugin = (config) => {
  return withAndroidStyles(config, async (config) => {
    config.modResults = assignStylesValue(config.modResults, {
      add: !!getRootViewBackgroundColor(config),
      parent: getAppThemeGroup(),
      name: ANDROID_WINDOW_BACKGROUND,
      value: `@color/${WINDOW_BACKGROUND_COLOR}`,
    });
    return config;
  });
};

export function getRootViewBackgroundColor(
  config: Pick<ExpoConfig, 'android' | 'backgroundColor'>
) {
  return config.android?.backgroundColor || config.backgroundColor || null;
}
