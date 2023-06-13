import { ConfigPlugin } from 'expo/config-plugins';
/**
 * Enable including `strings` files from external packages.
 * Required for making the Apple Auth button support localizations.
 *
 * @param config
 * @returns
 */
export declare const withIOSMixedLocales: ConfigPlugin;
export declare const withAppleAuthIOS: ConfigPlugin;
