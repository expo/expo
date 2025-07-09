import { NativeModule } from 'expo-modules-core/types';

export type SplashScreenOptions = {
  /**
   * The duration of the fade out animation in milliseconds.
   * @default 400
   */
  duration?: number;
  /**
   * Whether to hide the splash screen with a fade out animation.
   * @platform ios
   * @default false
   */
  fade?: boolean;
};

export interface SplashScreenNativeModule extends NativeModule {
  setOptions: (options: SplashScreenOptions) => void;
  preventAutoHideAsync: () => Promise<boolean>;
  hide: () => void;
  hideAsync: () => Promise<void>;
  // @private
  _internal_maybeHideAsync: () => Promise<void>;
  // @private
  _internal_preventAutoHideAsync: () => Promise<boolean>;
}
