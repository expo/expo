import * as ApplePlugins from './apple-plugins';

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createInfoPlistPlugin = ApplePlugins.createInfoPlistPlugin('macos');

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createEntitlementsPlugin = ApplePlugins.createEntitlementsPlugin('macos');

export const createInfoPlistPluginWithPropertyGuard =
  ApplePlugins.createInfoPlistPluginWithPropertyGuard('macos');

/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export const withAppDelegate = ApplePlugins.withAppDelegate('macos');

/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.macos.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withInfoPlist = ApplePlugins.withInfoPlist('macos');

/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.macos.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withEntitlementsPlist = ApplePlugins.withEntitlementsPlist('macos');

/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
export const withExpoPlist = ApplePlugins.withExpoPlist('macos');

/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
export const withXcodeProject = ApplePlugins.withXcodeProject('macos');

/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
export const withPodfile = ApplePlugins.withPodfile('macos');

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export const withPodfileProperties = ApplePlugins.withPodfileProperties('macos');
