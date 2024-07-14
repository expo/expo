import * as ApplePlugins from './apple-plugins';

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createInfoPlistPlugin = ApplePlugins.createInfoPlistPlugin('ios');

/**
 * Helper method for creating mods from existing config functions.
 *
 * @param action
 */
export const createEntitlementsPlugin = ApplePlugins.createEntitlementsPlugin('ios');

export const createInfoPlistPluginWithPropertyGuard =
  ApplePlugins.createInfoPlistPluginWithPropertyGuard('ios');

/**
 * Provides the AppDelegate file for modification.
 *
 * @param config
 * @param action
 */
export const withAppDelegate = ApplePlugins.withAppDelegate('ios');

/**
 * Provides the Info.plist file for modification.
 * Keeps the config's expo.ios.infoPlist object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withInfoPlist = ApplePlugins.withInfoPlist('ios');

/**
 * Provides the main .entitlements file for modification.
 * Keeps the config's expo.ios.entitlements object in sync with the data.
 *
 * @param config
 * @param action
 */
export const withEntitlementsPlist = ApplePlugins.withEntitlementsPlist('ios');

/**
 * Provides the Expo.plist for modification.
 *
 * @param config
 * @param action
 */
export const withExpoPlist = ApplePlugins.withExpoPlist('ios');

/**
 * Provides the main .xcodeproj for modification.
 *
 * @param config
 * @param action
 */
export const withXcodeProject = ApplePlugins.withXcodeProject('ios');

/**
 * Provides the Podfile for modification.
 *
 * @param config
 * @param action
 */
export const withPodfile = ApplePlugins.withPodfile('ios');

/**
 * Provides the Podfile.properties.json for modification.
 *
 * @param config
 * @param action
 */
export const withPodfileProperties = ApplePlugins.withPodfileProperties('ios');
