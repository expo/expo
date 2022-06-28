import type { ExpoConfig } from '@expo/config-types';
import type { JSONObject } from '@expo/json-file';
import type { XcodeProject } from 'xcode';
import type { ConfigPlugin, Mod } from '../Plugin.types';
import type { ExpoPlist, InfoPlist } from '../ios/IosConfig.types';
import type { AppDelegateProjectFile } from '../ios/Paths';
declare type MutateInfoPlistAction = (expo: ExpoConfig, infoPlist: InfoPlist) => Promise<InfoPlist> | InfoPlist;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare function createInfoPlistPlugin(action: MutateInfoPlistAction, name?: string): ConfigPlugin;
export declare function createInfoPlistPluginWithPropertyGuard(action: MutateInfoPlistAction, settings: {
    infoPlistProperty: string;
    expoConfigProperty: string;
    expoPropertyGetter?: (config: ExpoConfig) => string;
}, name?: string): ConfigPlugin;
declare type MutateEntitlementsPlistAction = (expo: ExpoConfig, entitlements: JSONObject) => JSONObject;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare function createEntitlementsPlugin(action: MutateEntitlementsPlistAction, name: string): ConfigPlugin;
/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export declare const withAppDelegate: ConfigPlugin<Mod<AppDelegateProjectFile>>;
/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.ios.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
export declare const withInfoPlist: ConfigPlugin<Mod<InfoPlist>>;
/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.ios.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
export declare const withEntitlementsPlist: ConfigPlugin<Mod<JSONObject>>;
/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
export declare const withExpoPlist: ConfigPlugin<Mod<ExpoPlist>>;
/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
export declare const withXcodeProject: ConfigPlugin<Mod<XcodeProject>>;
/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export declare const withPodfileProperties: ConfigPlugin<Mod<Record<string, string>>>;
export {};
