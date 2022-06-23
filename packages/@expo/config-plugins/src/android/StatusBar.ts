import { ExpoConfig } from '@expo/config-types';
import assert from 'assert';

import { ConfigPlugin } from '../Plugin.types';
import { withAndroidColors, withAndroidStyles } from '../plugins/android-plugins';
import { assignColorValue } from './Colors';
import { ResourceXML } from './Resources';
import { assignStylesValue, getAppThemeLightNoActionBarGroup } from './Styles';

// https://developer.android.com/reference/android/R.attr#colorPrimaryDark
const COLOR_PRIMARY_DARK_KEY = 'colorPrimaryDark';
// https://developer.android.com/reference/android/R.attr#windowTranslucentStatus
const WINDOW_TRANSLUCENT_STATUS = 'android:windowTranslucentStatus';
// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';

export const withStatusBar: ConfigPlugin = config => {
  config = withStatusBarColors(config);
  config = withStatusBarStyles(config);
  return config;
};

const withStatusBarColors: ConfigPlugin = config => {
  return withAndroidColors(config, config => {
    config.modResults = setStatusBarColors(config, config.modResults);
    return config;
  });
};

const withStatusBarStyles: ConfigPlugin = config => {
  return withAndroidStyles(config, config => {
    config.modResults = setStatusBarStyles(config, config.modResults);
    return config;
  });
};

export function setStatusBarColors(
  config: Pick<ExpoConfig, 'androidStatusBar'>,
  colors: ResourceXML
): ResourceXML {
  return assignColorValue(colors, {
    name: COLOR_PRIMARY_DARK_KEY,
    value: getStatusBarColor(config),
  });
}

export function setStatusBarStyles(
  config: Pick<ExpoConfig, 'androidStatusBar'>,
  styles: ResourceXML
): ResourceXML {
  const hexString = getStatusBarColor(config);
  const floatElement = getStatusBarTranslucent(config);

  styles = assignStylesValue(styles, {
    parent: getAppThemeLightNoActionBarGroup(),
    name: WINDOW_LIGHT_STATUS_BAR,
    targetApi: '23',
    value: 'true',
    // Default is light-content, don't need to do anything to set it
    add: getStatusBarStyle(config) === 'dark-content',
  });

  styles = assignStylesValue(styles, {
    parent: getAppThemeLightNoActionBarGroup(),
    name: WINDOW_TRANSLUCENT_STATUS,
    value: 'true',
    // translucent status bar set in theme
    add: floatElement,
  });

  styles = assignStylesValue(styles, {
    parent: getAppThemeLightNoActionBarGroup(),
    name: COLOR_PRIMARY_DARK_KEY,
    value: `@color/${COLOR_PRIMARY_DARK_KEY}`,
    // Remove the color if translucent is used
    add: !!hexString,
  });

  return styles;
}

export function getStatusBarColor(config: Pick<ExpoConfig, 'androidStatusBar'>) {
  const backgroundColor = config.androidStatusBar?.backgroundColor;
  if (backgroundColor) {
    // Drop support for translucent
    assert(
      backgroundColor !== 'translucent',
      `androidStatusBar.backgroundColor must be a valid hex string, instead got: "${backgroundColor}"`
    );
  }
  return backgroundColor;
}

/**
 * Specifies whether the status bar should be "translucent". When true, the status bar is drawn with `position: absolute` and a gray underlay, when false `position: relative` (pushes content down).
 *
 * @default false
 * @param config
 * @returns
 */
export function getStatusBarTranslucent(config: Pick<ExpoConfig, 'androidStatusBar'>): boolean {
  return config.androidStatusBar?.translucent ?? false;
}

export function getStatusBarStyle(config: Pick<ExpoConfig, 'androidStatusBar'>) {
  return config.androidStatusBar?.barStyle || 'light-content';
}
