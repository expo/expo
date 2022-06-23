import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
declare type Bitcode = NonNullable<ExpoConfig['ios']>['bitcode'];
/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
export declare const withBitcode: ConfigPlugin;
/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export declare const withCustomBitcode: ConfigPlugin<Bitcode>;
/**
 * Get the bitcode preference from the Expo config.
 */
export declare function getBitcode(config: Pick<ExpoConfig, 'ios'>): Bitcode;
/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export declare function setBitcodeWithConfig(config: Pick<ExpoConfig, 'ios'>, { project }: {
    project: XcodeProject;
}): XcodeProject;
/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export declare function setBitcode(bitcode: Bitcode, { project }: {
    project: XcodeProject;
}): XcodeProject;
export {};
