import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
export type Bitcode = NonNullable<ExpoConfig['ios' | 'macos']>['bitcode'];
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` or `macos.bitcode` value.
 */
export declare const withBitcode: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode` or `macos.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export declare const withCustomBitcode: (applePlatform: 'ios' | 'macos') => ConfigPlugin<Bitcode>;
/**
 * Get the bitcode preference from the Expo config.
 */
export declare const getBitcode: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => Bitcode;
/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export declare const setBitcodeWithConfig: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, { project }: {
    project: XcodeProject;
}) => XcodeProject;
/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export declare const setBitcode: (applePlatform: 'ios' | 'macos') => (bitcode: Bitcode, { project }: {
    project: XcodeProject;
}) => XcodeProject;
