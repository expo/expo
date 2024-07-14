export declare const withBundleIdentifier: import("..").ConfigPlugin<{
    bundleIdentifier?: string | undefined;
}>;
export declare const getBundleIdentifier: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | null;
/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
export declare const setBundleIdentifier: (config: import("@expo/config-types").ExpoConfig, infoPlist: import("./MacosConfig.types").InfoPlist) => import("./MacosConfig.types").InfoPlist;
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
 * @param {string} projectRoot Path to project root containing the macos directory
 * @param {string} targetName Target name
 * @param {string} buildConfiguration Build configuration. Defaults to 'Release'.
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */
export declare const getBundleIdentifierFromPbxproj: (projectRoot: string, options?: {
    targetName?: string | undefined;
    buildConfiguration?: string | undefined;
}) => string | null;
/**
 * Updates the bundle identifier for pbx projects inside the macos directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the macos directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
export declare const setBundleIdentifierForPbxproj: (projectRoot: string, bundleIdentifier: string, updateProductName?: boolean) => void;
export declare const resetAllPlistBundleIdentifiers: (projectRoot: string) => void;
export { updateBundleIdentifierForPbxproj, resetPlistBundleIdentifier, } from '../apple/BundleIdentifier';
