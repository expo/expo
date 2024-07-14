/// <reference types="xcode" />
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `macos.bitcode` value.
 */
export declare const withBitcode: import("..").ConfigPlugin;
/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `macos.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export declare const withCustomBitcode: import("..").ConfigPlugin<string | boolean | undefined>;
/**
 * Get the bitcode preference from the Expo config.
 */
export declare const getBitcode: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">) => string | boolean | undefined;
/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export declare const setBitcodeWithConfig: (config: Pick<import("@expo/config-types").ExpoConfig, "ios" | "macos">, { project }: {
    project: import("xcode").XcodeProject;
}) => import("xcode").XcodeProject;
/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export declare const setBitcode: (bitcode: string | boolean | undefined, { project }: {
    project: import("xcode").XcodeProject;
}) => import("xcode").XcodeProject;
