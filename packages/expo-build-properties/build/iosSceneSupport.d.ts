import type { ConfigPlugin } from 'expo/config-plugins';
import type { PluginConfigType } from './pluginConfig';
/**
 * Adopts the UIKit scene lifecycle in SDK 57 projects when `ios.enableSceneSupport` is set.
 * SDK 58 and newer include scene support in the template, so the property is a no-op there.
 */
export declare const withIosSceneSupport: ConfigPlugin<PluginConfigType>;
