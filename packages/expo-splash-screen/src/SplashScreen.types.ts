import type { NativeModule } from 'expo-modules-core/types';

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
  /**
   * Whether to show the splash screen when React Native reloads the app.
   * Set this option before triggering a reload. Use `preventAutoHideAsync()` and
   * `hide()` to control when the splash screen is hidden after the reload.
   * @platform ios
   * @default false
   */
  showOnReload?: boolean;
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
