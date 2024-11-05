import { SplashScreenOptions } from './SplashScreen.types';
/**
 * Expo Router uses this internal method to ensure that we can detect if the user
 * has explicitly opted into preventing the splash screen from hiding. This means
 * they will also explicitly hide it. If they don't, we will hide it for them after
 * the navigation render completes.
 *
 * @private
 */
export declare function _internal_preventAutoHideAsync(): Promise<boolean>;
/**
 * Used for Expo libraries to attempt hiding the splash screen after they've completed their work.
 * If the user has explicitly opted into preventing the splash screen from hiding, we should not
 * hide it for them. This is often used for animated splash screens.
 *
 * @private
 */
export declare const _internal_maybeHideAsync: () => void;
export declare function setOptions(options: SplashScreenOptions): void;
export declare function hide(): void;
export declare function hideAsync(): Promise<void>;
export declare const preventAutoHideAsync: () => Promise<boolean>;
//# sourceMappingURL=index.native.d.ts.map