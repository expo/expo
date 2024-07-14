/// <reference types="xcode" />
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare const createInfoPlistPlugin: (action: (expo: import("@expo/config-types").ExpoConfig, infoPlist: import("..").InfoPlist) => import("..").InfoPlist | Promise<import("..").InfoPlist>, name?: string | undefined) => import("..").ConfigPlugin;
/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export declare const createEntitlementsPlugin: (action: (expo: import("@expo/config-types").ExpoConfig, entitlements: import("@expo/json-file").JSONObject) => import("@expo/json-file").JSONObject, name: string) => import("..").ConfigPlugin;
export declare const createInfoPlistPluginWithPropertyGuard: (action: (expo: import("@expo/config-types").ExpoConfig, infoPlist: import("..").InfoPlist) => import("..").InfoPlist | Promise<import("..").InfoPlist>, settings: {
    infoPlistProperty: string;
    expoConfigProperty: string;
    expoPropertyGetter?: ((config: import("@expo/config-types").ExpoConfig) => string) | undefined;
}, name?: string | undefined) => import("..").ConfigPlugin;
/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export declare const withAppDelegate: import("..").ConfigPlugin<import("..").Mod<import("../apple/Paths").AppDelegateProjectFile>>;
/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.macos.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
export declare const withInfoPlist: import("..").ConfigPlugin<import("..").Mod<import("..").InfoPlist>>;
/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.macos.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
export declare const withEntitlementsPlist: import("..").ConfigPlugin<import("..").Mod<import("@expo/json-file").JSONObject>>;
/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
export declare const withExpoPlist: import("..").ConfigPlugin<import("..").Mod<import("..").ExpoPlist>>;
/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
export declare const withXcodeProject: import("..").ConfigPlugin<import("..").Mod<import("xcode").XcodeProject>>;
/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
export declare const withPodfile: import("..").ConfigPlugin<import("..").Mod<import("../apple/Paths").PodfileProjectFile>>;
/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export declare const withPodfileProperties: import("..").ConfigPlugin<import("..").Mod<Record<string, string>>>;
