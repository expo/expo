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

const withSplashScreen: ConfigPlugin<PluginConfig | null> = (config, props) => {
  let android: AndroidSplashConfig | null = null;
  let ios: IOSSplashConfig | null = null;

  const resizeMode = props?.resizeMode || 'contain';

  const { ios: iosProps, android: androidProps, ...otherProps } = props ?? ({} as PluginConfig);

  const usesLegacySplashConfigIOS =
    !props || (androidProps && !iosProps && Object.keys(otherProps).length === 0);
  const usesLegacySplashConfigAndroid =
    !props || (iosProps && !androidProps && Object.keys(otherProps).length === 0);

  android = usesLegacySplashConfigAndroid
    ? null
    : {
        ...otherProps,
        ...androidProps,
        resizeMode: androidProps?.resizeMode || resizeMode,
        dark: {
          ...otherProps?.dark,
          ...androidProps?.dark,
        },
      };

  ios = usesLegacySplashConfigIOS
    ? null
    : {
        ...otherProps,
        ...iosProps,
        resizeMode: iosProps?.resizeMode || (resizeMode === 'native' ? 'contain' : resizeMode),
        dark: {
          ...otherProps?.dark,
          ...iosProps?.dark,
        },
      };

  // Passing null here will result in the legacy splash config being used.
  config = withAndroidSplashScreen(config, android);
  config = withIosSplashScreen(config, ios);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
