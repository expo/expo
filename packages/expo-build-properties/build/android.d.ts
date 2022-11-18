import { ConfigPlugin } from 'expo/config-plugins';
import type { PluginConfigType } from './pluginConfig';
export declare const withAndroidBuildProperties: ConfigPlugin<PluginConfigType>;
/**
 * Appends `props.android.extraProguardRules` content into `android/app/proguard-rules.pro`
 */
export declare const withAndroidProguardRules: ConfigPlugin<PluginConfigType>;
export declare const withAndroidPurgeProguardRulesOnce: ConfigPlugin;
/**
 * Update `newProguardRules` to original `proguard-rules.pro` contents if needed
 *
 * @param contents the original `proguard-rules.pro` contents
 * @param newProguardRules new proguard rules to add. If the value is null, the returned value will be original `contents`.
 * @returns return updated contents
 */
export declare function updateAndroidProguardRules(contents: string, newProguardRules: string | null, updateMode: 'append' | 'overwrite'): string;
