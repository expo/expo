import { ModPlatform } from '../Plugin.types';
/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » android: android.package: property is invalid https://expo.fyi/android-package
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
export declare function addWarningAndroid(property: string, text: string, link?: string): void;
/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » ios: ios.bundleIdentifier: property is invalid https://expo.fyi/bundle-identifier
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
export declare function addWarningIOS(property: string, text: string, link?: string): void;
export declare function addWarningForPlatform(platform: ModPlatform, property: string, text: string, link?: string): void;
