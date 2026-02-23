import { ExpoConfig } from '@expo/config-types';

import { ResourceXML } from './Resources';
import { assignStylesValue, getAppThemeGroup } from './Styles';
import { ConfigPlugin } from '../Plugin.types';
import { withAndroidStyles } from '../plugins/android-plugins';

// https://developer.android.com/reference/android/R.attr#windowLightStatusBar
const WINDOW_LIGHT_STATUS_BAR = 'android:windowLightStatusBar';
// https://developer.android.com/reference/android/R.attr#statusBarColor
const STATUS_BAR_COLOR = 'android:statusBarColor';

export const withStatusBar: ConfigPlugin = (config) => {
  config = withStatusBarStyles(config);
  return config;
};

const withStatusBarStyles: ConfigPlugin = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setStatusBarStyles(config, config.modResults);
    return config;
  });
};

export function setStatusBarStyles(
  config: Pick<ExpoConfig, 'androidStatusBar'>,
  styles: ResourceXML
): ResourceXML {
  styles = assignStylesValue(styles, {
    parent: getAppThemeGroup(),
    name: WINDOW_LIGHT_STATUS_BAR,
    value: 'true',
    // Default is light-content, don't need to do anything to set it
    add: getStatusBarStyle(config) === 'dark-content',
  });

  styles = assignStylesValue(styles, {
    parent: getAppThemeGroup(),
    name: STATUS_BAR_COLOR,
    value: '@android:color/transparent',
    add: true,
  });

  return styles;
}

export function getStatusBarStyle(config: Pick<ExpoConfig, 'androidStatusBar'>) {
  return config.androidStatusBar?.barStyle || 'light-content';
}
