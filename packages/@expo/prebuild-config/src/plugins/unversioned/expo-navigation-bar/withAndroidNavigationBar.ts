import {
  AndroidConfig,
  ConfigPlugin,
  WarningAggregator,
  withAndroidStyles,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withNavigationBar: ConfigPlugin = (config) => {
  if ('androidNavigationBar' in config) {
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar',
      'property is deprecated. Use the `expo-navigation-bar` plugin configuration instead.'
    );
  }

  config = withNavigationBarStyles(config);
  return config;
};

const withNavigationBarStyles: ConfigPlugin = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(config, config.modResults);
    return config;
  });
};

export function setNavigationBarStyles(
  config: Pick<ExpoConfig, 'androidNavigationBar'>,
  styles: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: getNavigationBarStyle(config) === 'dark-content',
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true',
  });
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:navigationBarColor',
    value: '@android:color/transparent',
  });

  return styles;
}

export function getNavigationBarStyle(config: Pick<ExpoConfig, 'androidNavigationBar'>) {
  return config.androidNavigationBar?.barStyle || 'light-content';
}
