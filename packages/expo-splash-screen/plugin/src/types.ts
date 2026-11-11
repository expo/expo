export interface BaseAndroidSplashConfig {
  backgroundColor?: string;
  image?: string;
  mdpi?: string;
  hdpi?: string;
  xhdpi?: string;
  xxhdpi?: string;
  xxxhdpi?: string;
}

export type AndroidSplashConfig = BaseAndroidSplashConfig & {
  backgroundColor: string; // remove optional
  drawable?: { icon: string; darkIcon?: string };
  imageWidth: number;
  resizeMode: 'contain' | 'cover' | 'native';
  dark?: BaseAndroidSplashConfig;
};

export type BaseIOSSplashConfig = {
  backgroundColor?: string;
  image?: string;
  tabletBackgroundColor?: string;
  tabletImage?: string;
};

export type IOSSplashConfig = BaseIOSSplashConfig & {
  backgroundColor: string; // remove optional
  enableFullScreenImage_legacy: boolean;
  imageWidth: number;
  resizeMode: 'cover' | 'contain';
  dark?: BaseIOSSplashConfig;
};

export type Props = {
  /**
   * Hex color for the splash screen background.
   * @default "#ffffff"
   */
  backgroundColor?: string;
  /**
   * Path to a React component (default export, no props) that draws the app's first screen with
   * core `View`/`Text`/`Image` components. At build time `expo export:embed` renders it through
   * React Native's Fabric renderer and bundles the result; at launch the native side commits that
   * tree through Fabric before React Native starts and shows it instead of the splash image.
   * A `.json` path is used as a prebuilt template instead.
   */
  prerender?: string;
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
  android?: Partial<AndroidSplashConfig>;
  /**
   * Properties for configuring the splash screen on iOS.
   * @platform ios
   */
  ios?: Partial<IOSSplashConfig>;
};
