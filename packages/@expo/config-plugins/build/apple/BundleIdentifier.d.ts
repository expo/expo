import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withBundleIdentifier: (applePlatform: 'ios' | 'macos') => ConfigPlugin<{
    bundleIdentifier?: string;
}>;
declare const getBundleIdentifier: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => string | null;
/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
declare const setBundleIdentifier: (applePlatform: 'ios' | 'macos') => (config: ExpoConfig, infoPlist: InfoPlist) => InfoPlist;
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
 * @param {string} projectRoot Path to project root containing the ios (or macos) directory
 * @param {Object} options
 * @param {string} options.targetName Target name
 * @param {string} options.buildConfiguration Build configuration. Defaults to 'Release'.
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */
declare const getBundleIdentifierFromPbxproj: (applePlatform: 'ios' | 'macos') => (projectRoot: string, options?: {
    targetName?: string;
    buildConfiguration?: string;
}) => string | null;
/**
 * Updates the bundle identifier for a given pbxproj
 *
 * @param {string} pbxprojPath Path to pbxproj file
 * @param {string} bundleIdentifier Bundle identifier to set in the pbxproj
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
declare function updateBundleIdentifierForPbxproj(pbxprojPath: string, bundleIdentifier: string, updateProductName?: boolean): void;
/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
declare const setBundleIdentifierForPbxproj: (applePlatform: 'ios' | 'macos') => (projectRoot: string, bundleIdentifier: string, updateProductName?: boolean) => void;
declare const resetAllPlistBundleIdentifiers: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => void;
declare function resetPlistBundleIdentifier(plistPath: string): void;
export { getBundleIdentifier, setBundleIdentifier, getBundleIdentifierFromPbxproj, updateBundleIdentifierForPbxproj, setBundleIdentifierForPbxproj, resetAllPlistBundleIdentifiers, resetPlistBundleIdentifier, };
