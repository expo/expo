import {
  AndroidConfig,
  ConfigPlugin,
  WarningAggregator,
  withAndroidStyles,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withNavigationBar: ConfigPlugin = (config) => {
  const { androidNavigationBar = {} } = config;

  if ('visible' in androidNavigationBar) {
    // Immersive mode needs to be set programmatically
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar.visible',
      'Property is deprecated in Android 11 (API 30) and will be removed from Expo SDK.',
      'https://expo.fyi/android-navigation-bar-visible-deprecated'
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
