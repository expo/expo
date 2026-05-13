import type { ResourceXML } from './Resources';
import { assignStylesValue, getAppThemeGroup } from './Styles';
import type { ConfigPlugin } from '../Plugin.types';
import { withAndroidStyles } from '../plugins/android-plugins';
import * as WarningAggregator from '../utils/warnings';

const TAG = 'SYSTEM_BARS_PLUGIN';

export const setSystemBarsStyles = (styles: ResourceXML): ResourceXML => {
  styles = assignStylesValue(styles, {
    add: true,
    parent: getAppThemeGroup(),
    name: 'android:statusBarColor',
    value: '@android:color/transparent',
  });

  styles = assignStylesValue(styles, {
    add: true,
    parent: getAppThemeGroup(),
    name: 'android:navigationBarColor',
    value: '@android:color/transparent',
  });

  return styles;
};

export const withSystemBars: ConfigPlugin = (config) => {
  if ('androidStatusBar' in config) {
    WarningAggregator.addWarningAndroid(
      TAG,
      '`androidStatusBar` is deprecated and has no effect. Use the `expo-status-bar` plugin configuration instead.'
    );
  }
  if ('androidNavigationBar' in config) {
    WarningAggregator.addWarningAndroid(
      TAG,
      '`androidNavigationBar` is deprecated and has no effect. Use the `expo-navigation-bar` plugin configuration instead.'
    );
  }

  return withAndroidStyles(config, (config) => {
    config.modResults = setSystemBarsStyles(config.modResults);
    return config;
  });
};
