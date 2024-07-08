export type SplashScreenOptions = {
  /**
   * The duration of the fade out animation in milliseconds.
   * @default 2000
   */
  duration?: number;
};

export type SplashScreenNativeModule = {
  installSplashScreen: (options: SplashScreenOptions) => void;
  preventAutoHideAsync: () => Promise<boolean>;
  hide: () => void;
};
