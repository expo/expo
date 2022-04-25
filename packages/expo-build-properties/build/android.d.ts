import { ConfigPlugin } from '@expo/config-plugins';
import type { PluginConfigType } from './pluginConfig';
export declare const withAndroidBuildProperties: ConfigPlugin<PluginConfigType>;
/**
 * Appends `props.android.extraProguardRules` content into `android/app/proguard-rules.pro`
 */
export declare const withAndroidProguardRules: ConfigPlugin<PluginConfigType>;
