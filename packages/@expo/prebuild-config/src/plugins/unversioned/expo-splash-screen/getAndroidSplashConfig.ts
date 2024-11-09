import { ExpoConfig } from '@expo/config-types';

export type SplashScreenConfig = {
  xxxhdpi?: string;
  xxhdpi?: string;
  xhdpi?: string;
  hdpi?: string;
  mdpi?: string;
  image?: string;
  backgroundColor?: string;
  resizeMode: 'contain' | 'cover' | 'native';
  dark?: {
    backgroundColor?: string;
    xxxhdpi?: string;
    xxhdpi?: string;
    xhdpi?: string;
    hdpi?: string;
    mdpi?: string;
    image?: string;
    resizeMode?: 'contain' | 'cover' | 'native';
  };
};

export type AndroidSplashConfig = {
  imageWidth?: number;
} & SplashScreenConfig;

const defaultResizeMode = 'contain';

export function getAndroidSplashConfig(
  config: Pick<ExpoConfig, 'splash' | 'android'>,
  props?: AndroidSplashConfig | null
): AndroidSplashConfig | null {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (props) {
    const splash = props;
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      imageWidth: splash.imageWidth,
    };
  }

  if (config.android?.splash) {
    const splash = config.android?.splash;
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      image: splash.image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      imageWidth: 200,
    };
  }

  if (config.splash) {
    const splash = config.splash;
    return {
      xxxhdpi: splash.image,
      xxhdpi: splash.image,
      xhdpi: splash.image,
      hdpi: splash.image,
      mdpi: splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      imageWidth: 200,
    };
  }

  return null;
}

export function getAndroidDarkSplashConfig(
  config: Pick<ExpoConfig, 'splash' | 'android'>,
  props?: AndroidSplashConfig | null
): SplashScreenConfig | null {
  if (props?.dark) {
    const splash = props.dark;
    const lightTheme = getAndroidSplashConfig(config, props);
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: lightTheme?.resizeMode ?? defaultResizeMode,
    };
  }

  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (config.android?.splash?.dark) {
    const splash = config.android?.splash?.dark;
    const lightTheme = getAndroidSplashConfig(config, props);
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      // Can't support dark resizeMode because the resize mode is hardcoded into the MainActivity.java
      resizeMode: lightTheme?.resizeMode ?? defaultResizeMode,
    };
  }

  return null;
}
