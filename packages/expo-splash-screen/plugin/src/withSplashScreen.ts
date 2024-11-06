import { AndroidSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { withAndroidSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen';
import { withIosSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen';
import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-splash-screen/package.json');

type PluginConfig = {
  backgroundColor: string;
  imageWidth?: number;
  enableFullScreenImage_legacy?: boolean;
  image?: string;
  dark?: {
    image?: string;
    backgroundColor?: string;
  };
  android?: AndroidSplashConfig;
  ios?: IOSSplashConfig;
};

const withSplashScreen: ConfigPlugin<PluginConfig> = (config, props) => {
  const imageWidth = props ? props.imageWidth : 200;
  const { dark, ...rest } = props;

  const android: AndroidSplashConfig = {
    ...rest,
    ...rest?.android,
    resizeMode: 'contain',
    dark: {
      ...rest?.android?.dark,
      ...dark,
      resizeMode: 'contain',
    },
    imageWidth,
  };
  const ios: IOSSplashConfig = {
    ...rest,
    ...rest?.ios,
    resizeMode: 'contain',
    dark: {
      ...rest?.ios?.dark,
      ...dark,
    },
    imageWidth,
  };

  config = withAndroidSplashScreen(config, android);
  config = withIosSplashScreen(config, ios);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
