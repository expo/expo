import { ConfigPlugin, WarningAggregator, withStringsXml } from '@expo/config-plugins';

export const withAndroidUserInterfaceStyle: ConfigPlugin<void> = config => {
  return withStringsXml(config, config => {
    const userInterfaceStyle = config.android?.userInterfaceStyle ?? config.userInterfaceStyle;
    if (userInterfaceStyle) {
      WarningAggregator.addWarningAndroid(
        'userInterfaceStyle',
        // TODO: Maybe warn that they need a certain version of React Native as well?
        'Install expo-system-ui in your project to enable this feature.'
      );
    }

    return config;
  });
};
