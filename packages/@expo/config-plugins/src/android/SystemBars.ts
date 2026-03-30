import { ConfigPlugin } from '../Plugin.types';
import * as WarningAggregator from '../utils/warnings';

export const withSystemBars: ConfigPlugin = (config) => {
  if ('androidStatusBar' in config) {
    WarningAggregator.addWarningAndroid(
      'SYSTEM_BARS_PLUGIN',
      '`androidStatusBar` is deprecated and has no effect. Use the `expo-status-bar` plugin configuration instead.'
    );
  }
  if ('androidNavigationBar' in config) {
    WarningAggregator.addWarningAndroid(
      'SYSTEM_BARS_PLUGIN',
      '`androidNavigationBar` is deprecated and has no effect. Use the `expo-navigation-bar` plugin configuration instead.'
    );
  }

  return config;
};
