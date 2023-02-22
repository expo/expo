/**
 * These are the versioned first-party plugins with some of the future third-party plugins mixed in for legacy support.
 */
import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
/**
 * Config plugin to apply all of the custom Expo iOS config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-updates, etc...
 */
export declare const withIosExpoPlugins: ConfigPlugin<{
    bundleIdentifier: string;
}>;
/**
 * Config plugin to apply all of the custom Expo Android config plugins we support by default.
 * TODO: In the future most of this should go into versioned packages like expo-updates, etc...
 */
export declare const withAndroidExpoPlugins: ConfigPlugin<{
    package: string;
}>;
export declare const withVersionedExpoSDKPlugins: ConfigPlugin<{
    expoUsername: string | null;
}>;
export declare function getAutoPlugins(): string[];
export declare function getLegacyExpoPlugins(): string[];
export declare function withLegacyExpoPlugins(config: ExpoConfig): ExpoConfig;
