import { ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

export const withIosStatusBarStyle: ConfigPlugin = (config) =>
  withInfoPlist(config, (config) => {
    const { experiments = {}, userInterfaceStyle = 'automatic' } = config;
    const { edgeToEdge = false } = experiments;

    const styles = {
      automatic: 'UIStatusBarStyleDefault',
      dark: 'UIStatusBarStyleLightContent',
      light: 'UIStatusBarStyleDarkContent',
    };

    config.modResults['UIStatusBarStyle'] = edgeToEdge
      ? styles[userInterfaceStyle]
      : styles['automatic'];

    return config;
  });
