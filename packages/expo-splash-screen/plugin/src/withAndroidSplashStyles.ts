import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} from 'expo/config-plugins';

import { AndroidSplashConfig } from './types';

const styleResourceGroup = {
  name: 'Theme.App.SplashScreen',
  parent: 'Theme.SplashScreen',
};

const SPLASH_COLOR_NAME = 'splashscreen_background';

export const withAndroidSplashStyles: ConfigPlugin<AndroidSplashConfig> = (config, splash) => {
  config = withAndroidColors(config, (config) => {
    config.modResults = setSplashColorsForTheme(config.modResults, splash.backgroundColor);
    return config;
  });
  config = withAndroidColorsNight(config, (config) => {
    const backgroundColor = splash.dark?.backgroundColor;
    if (!backgroundColor) {
      return config;
    }
    config.modResults = setSplashColorsForTheme(config.modResults, backgroundColor);
    return config;
  });
  config = withAndroidStyles(config, (config) => {
    config.modResults = removeOldSplashStyleGroup(config.modResults);
    config.modResults = addSplashScreenStyle(config.modResults);
    return config;
  });
  return config;
};

// Add the style that extends Theme.SplashScreen
function addSplashScreenStyle(styles: AndroidConfig.Resources.ResourceXML) {
  const { resources } = styles;
  const { style = [] } = resources;

  const item = [
    {
      $: { name: 'windowSplashScreenBackground' },
      _: '@color/splashscreen_background',
    },
    {
      $: { name: 'windowSplashScreenAnimatedIcon' },
      _: '@drawable/splashscreen_logo',
    },
    {
      $: { name: 'postSplashScreenTheme' },
      _: '@style/AppTheme',
    },
    {
      $: { name: 'android:windowSplashScreenBehavior' },
      _: 'icon_preferred',
    },
  ];

  styles.resources.style = [
    ...style.filter(({ $ }) => $.name !== 'Theme.App.SplashScreen'),
    {
      $: {
        ...styleResourceGroup,
        parent: 'Theme.SplashScreen',
      },
      item,
    },
  ];

  return styles;
}

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

export function setSplashStylesForTheme(styles: AndroidConfig.Resources.ResourceXML) {
  // Add splash screen image
  return AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    value: '@drawable/splashscreen_logo',
    name: 'android:windowSplashScreenBackground',
    parent: styleResourceGroup,
  });
}

export function setSplashColorsForTheme(
  colors: AndroidConfig.Resources.ResourceXML,
  backgroundColor: string | undefined
): AndroidConfig.Resources.ResourceXML {
  return AndroidConfig.Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: SPLASH_COLOR_NAME,
  });
}
