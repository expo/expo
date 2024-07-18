import { AndroidPluginConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSPluginConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { withAndroidSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen';
import { withIosSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen';
import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-splash-screen/package.json');

type PluginConfig = {
  backgroundColor: string;
  logoWidth: number;
  image?: string | null;
  android: AndroidPluginConfig;
  ios: IOSPluginConfig;
};

const withSplashScreen: ConfigPlugin<PluginConfig> = (config, props) => {
  const android = {
    ...props,
    ...props.android,
  };
  const ios = { ...props, ...props.ios };

  config = withAndroidSplashScreen(config, android);
  config = withIosSplashScreen(config, ios);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
