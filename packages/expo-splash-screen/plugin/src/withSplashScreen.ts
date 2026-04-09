import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { AndroidSplashConfig } from './getAndroidSplashConfig';
import { IOSSplashConfig } from './getIosSplashConfig';
import { withAndroidSplashScreen } from './withAndroidSplashScreen';
import { withIosSplashScreen } from './withIosSplashScreen';

const pkg = require('../../package.json');

export type Props = {
  /**
   * Hex color for the splash screen background.
   * @default "#ffffff"
   */
  backgroundColor?: string;
  /**
   * The width to make the image.
   * @default 100
   */
  imageWidth?: number;
  /**
   * Whether to use a full screen image as the splash screen. Legacy transition helper, will be removed.
   * @default false
   */
  enableFullScreenImage_legacy?: boolean;
  /**
   * Path to the image displayed on the splash screen.
   */
  image?: string;
  /**
   * How the image is scaled. Accepts `contain`, `cover`, `native`.
   * @default "contain"
   */
  resizeMode?: 'contain' | 'cover' | 'native';
  /**
   * Properties for configuring the splash screen in dark mode.
   */
  dark?: {
    image?: string;
    backgroundColor?: string;
  };
  /**
   * Properties for configuring the splash screen on Android.
   * @platform android
   */
  android?: AndroidSplashConfig;
  /**
   * Properties for configuring the splash screen on iOS.
   * @platform ios
   */
  ios?: IOSSplashConfig;
};

const withSplashScreen: ConfigPlugin<Props | null> = (config, props) => {
  if (props == null) {
    return config;
  }

  const { android, ios, resizeMode = 'contain', ...rest } = props;

  config = withAndroidSplashScreen(config, {
    ...rest,
    ...android,
    resizeMode: android?.resizeMode ?? resizeMode,
    dark: {
      ...rest?.dark,
      ...android?.dark,
    },
  });

  config = withIosSplashScreen(config, {
    ...rest,
    ...ios,
    resizeMode: ios?.resizeMode ?? (resizeMode === 'native' ? 'contain' : resizeMode),
    dark: {
      ...rest?.dark,
      ...ios?.dark,
    },
  });

  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
