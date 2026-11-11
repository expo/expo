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

export type PrerenderConfig = {
  /** Path to the React component (or `.json` template) of the first screen. */
  component?: string;
  /**
   * Capture the first screen on the device after the splash hides and prerender it on the next
   * launch. `SplashScreen.saveLaunchScreenAsync()` recaptures on demand.
   * @platform ios
   * @default false
   */
  snapshot?: boolean;
};

export type Props = {
  /**
   * Hex color for the splash screen background.
   * @default "#ffffff"
   */
  backgroundColor?: string;
  /**
   * Draws the app's first screen through Fabric before React Native starts, instead of the splash
   * image. A string is the path to a React component (default export, no props) that draws the
   * first screen with core `View`/`Text`/`Image` components; `expo export:embed` renders it at build
   * time and the native side commits the result at launch. A `.json` path is a prebuilt template.
   * The object form adds `snapshot`: once the splash is hidden, the screen on display is captured
   * and prerendered on the next launch (iOS), so the first screen follows the app's state (signed in
   * or out, theme, locale). With `snapshot` alone the very first launch shows the splash image.
   */
  prerender?: string | PrerenderConfig;
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
