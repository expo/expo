import { SplashScreenOptions } from './SplashScreen.types';
export declare function setOptions(options: SplashScreenOptions): void;
export declare function hide(): void;
export declare function hideAsync(): Promise<void>;
export declare function preventAutoHideAsync(): Promise<boolean | undefined>;
/**
 * For use by libraries that want to control the splash screen without
 * interfering with user control of it.
 * @private
 */
export declare function _internal_preventAutoHideAsync(): Promise<boolean>;
/**
 * For use by libraries that want to control the splash screen without
 * interfering with user control of it.
 * @private
 */
export declare function _internal_maybeHideAsync(): Promise<false | void>;
//# sourceMappingURL=index.native.d.ts.map