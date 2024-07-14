import * as AppleImpl from '../apple/BundleIdentifier';

export const withBundleIdentifier = AppleImpl.withBundleIdentifier('ios');

export const getBundleIdentifier = AppleImpl.getBundleIdentifier('ios');

/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
export const setBundleIdentifier = AppleImpl.setBundleIdentifier('ios');

/**
 * Gets the bundle identifier defined in the Xcode project found in the project directory.
 *
 * A bundle identifier is stored as a value in XCBuildConfiguration entry.
 * Those entries exist for every pair (build target, build configuration).
 * Unless target name is passed, the first target defined in the pbxproj is used
 * (to keep compatibility with the inaccurate legacy implementation of this function).
 * The build configuration is usually 'Release' or 'Debug'. However, it could be any arbitrary string.
 * Defaults to 'Release'.
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} targetName Target name
 * @param {string} buildConfiguration Build configuration. Defaults to 'Release'.
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */
export const getBundleIdentifierFromPbxproj = AppleImpl.getBundleIdentifierFromPbxproj('ios');


/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
export const setBundleIdentifierForPbxproj = AppleImpl.setBundleIdentifierForPbxproj('ios');

export const resetAllPlistBundleIdentifiers = AppleImpl.resetAllPlistBundleIdentifiers('ios');

export {
  updateBundleIdentifierForPbxproj,
  resetPlistBundleIdentifier,
} from '../apple/BundleIdentifier';
