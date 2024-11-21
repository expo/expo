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
  resizeMode?: 'contain' | 'cover' | 'native';
  dark?: {
    image?: string;
    backgroundColor?: string;
  };
  android?: AndroidSplashConfig;
  ios?: IOSSplashConfig;
};

const withSplashScreen: ConfigPlugin<PluginConfig> = (config, props) => {
  const resizeMode = props?.resizeMode || 'contain';
  const android: AndroidSplashConfig = {
    ...props,
    ...props?.android,
    resizeMode,
    dark: {
      ...props?.android?.dark,
      ...props?.dark,
    },
  };
  const ios: IOSSplashConfig = {
    ...props,
    ...props?.ios,
    resizeMode: resizeMode === 'native' ? 'contain' : resizeMode,
    dark: {
      ...props?.ios?.dark,
      ...props?.dark,
    },
  };

  // Need to pass null here if we don't receive any props. This means that the plugin has not been used.
  // This only happens on Android. On iOS, if you don't use the plugin, this function won't be called.
  config = withAndroidSplashScreen(config, props ? android : null);
  config = withIosSplashScreen(config, ios);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
