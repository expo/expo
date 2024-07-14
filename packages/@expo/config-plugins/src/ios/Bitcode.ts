import * as AppleImpl from '../apple/Bitcode';

/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
export const withBitcode = AppleImpl.withBitcode('ios');

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export const withCustomBitcode = AppleImpl.withCustomBitcode('ios');

/**
 * Get the bitcode preference from the Expo config.
 */
export const getBitcode = AppleImpl.getBitcode('ios');

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export const setBitcodeWithConfig = AppleImpl.setBitcodeWithConfig('ios');

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export const setBitcode = AppleImpl.setBitcode('ios');
