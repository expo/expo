import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} from '@expo/config-plugins';
import { Colors } from '@expo/config-plugins/build/android';
import { ExpoConfig } from '@expo/config-types';

import { getAndroidDarkSplashConfig, getAndroidSplashConfig } from './getAndroidSplashConfig';

const styleResourceGroup = {
  name: 'Theme.App.SplashScreen',
  parent: 'AppTheme',
};

const SPLASH_COLOR_NAME = 'splashscreen_background';

export const withAndroidSplashStyles: ConfigPlugin = config => {
  config = withAndroidColors(config, config => {
    const backgroundColor = getSplashBackgroundColor(config);
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = withAndroidColorsNight(config, config => {
    const backgroundColor = getSplashDarkBackgroundColor(config);
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = withAndroidStyles(config, config => {
    config.modResults = removeOldSplashStyleGroup(config.modResults);
    config.modResults = setSplashStylesForTheme(config.modResults);
    return config;
  });
  return config;
};

// Remove the old style group which didn't extend the base theme properly.
export function removeOldSplashStyleGroup(styles: AndroidConfig.Resources.ResourceXML) {
  const group = {
    name: 'Theme.App.SplashScreen',
    parent: 'Theme.AppCompat.Light.NoActionBar',
  };

  styles.resources.style = styles.resources.style?.filter?.(({ $: head }) => {
    let matches = head.name === group.name;
    if (group.parent != null && matches) {
      matches = head.parent === group.parent;
    }
    return !matches;
  });

  return styles;
}

export function getSplashBackgroundColor(config: ExpoConfig): string | null {
  return getAndroidSplashConfig(config)?.backgroundColor ?? null;
}

export function getSplashDarkBackgroundColor(config: ExpoConfig): string | null {
  return getAndroidDarkSplashConfig(config)?.backgroundColor ?? null;
}

export function setSplashStylesForTheme(styles: AndroidConfig.Resources.ResourceXML) {
  // Add splash screen image
  return AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    value: '@drawable/splashscreen',
    name: 'android:windowBackground',
    parent: styleResourceGroup,
  });
}

export function setSplashColorsForTheme(
  colors: AndroidConfig.Resources.ResourceXML,
  backgroundColor: string | null
): AndroidConfig.Resources.ResourceXML {
  return Colors.assignColorValue(colors, { value: backgroundColor, name: SPLASH_COLOR_NAME });
}
