import type { ExpoConfig } from 'expo/config';
import { AndroidConfig, type AndroidManifest, type ConfigPlugin } from 'expo/config-plugins';
export declare const withGeneratedAndroidScheme: ConfigPlugin;
export declare function setGeneratedAndroidScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, androidManifest: AndroidManifest): AndroidManifest;
/**
 * Remove the custom Expo dev client scheme from intent filters, which are set to `autoVerify=true`.
 * The custom scheme `<data android:scheme="exp+<slug>"/>` seems to block verification for these intent filters.
 * This plugin makes sure there is no scheme in the autoVerify intent filters, that starts with `exp+`.
 
 * Iterate over all `autoVerify=true` intent filters, and pull out schemes matching with `exp+<slug>`.
 *
 * @param {AndroidManifest} androidManifest
 */
export declare function removeExpoSchemaFromVerifiedIntentFilters(config: Pick<ExpoConfig, 'scheme' | 'slug'>, androidManifest: AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
