import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';

import { isNotComment } from './utils/Xcodeproj';
import { ConfigPlugin } from '../Plugin.types';
import { withXcodeProject } from '../plugins/apple-plugins';
import { addWarningForPlatform } from '../utils/warnings';

export type Bitcode = NonNullable<ExpoConfig['ios' | 'macos']>['bitcode'];

/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` or `macos.bitcode` value.
 */
export const withBitcode: (applePlatform: 'ios' | 'macos') => ConfigPlugin =
  (applePlatform: 'ios' | 'macos') => (config) => {
    return withXcodeProject(applePlatform)(config, async (config) => {
      config.modResults = await setBitcodeWithConfig(applePlatform)(config, {
        project: config.modResults,
      });
      return config;
    });
  };

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode` or `macos.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export const withCustomBitcode: (applePlatform: 'ios' | 'macos') => ConfigPlugin<Bitcode> =
  (applePlatform: 'ios' | 'macos') => (config, bitcode) => {
    return withXcodeProject(applePlatform)(config, async (config) => {
      config.modResults = await setBitcode(applePlatform)(bitcode, {
        project: config.modResults,
      });
      return config;
    });
  };

/**
 * Get the bitcode preference from the Expo config.
 */
export const getBitcode =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>): Bitcode =>
    config[applePlatform]?.bitcode;

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export const setBitcodeWithConfig =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    { project }: { project: XcodeProject }
  ): XcodeProject => {
    const bitcode = getBitcode(applePlatform)(config);
    return setBitcode(applePlatform)(bitcode, { project });
  };

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export const setBitcode =
  (applePlatform: 'ios' | 'macos') =>
  (bitcode: Bitcode, { project }: { project: XcodeProject }): XcodeProject => {
    const isDefaultBehavior = bitcode == null;
    // If the value is undefined, then do nothing.
    if (isDefaultBehavior) {
      return project;
    }

    const targetName = typeof bitcode === 'string' ? bitcode : undefined;
    const isBitcodeEnabled = !!bitcode;
    if (targetName) {
      // Assert if missing
      const configs = Object.entries(project.pbxXCBuildConfigurationSection()).filter(isNotComment);
      const hasConfiguration = configs.find(
        ([, configuration]) => configuration.name === targetName
      );
      if (hasConfiguration) {
        // If targetName is defined then disable bitcode everywhere.
        project.addBuildProperty('ENABLE_BITCODE', 'NO');
      } else {
        const names = [
          // Remove duplicates, wrap in double quotes, and sort alphabetically.
          ...new Set(configs.map(([, configuration]) => `"${configuration.name}"`)),
        ].sort();
        addWarningForPlatform(
          applePlatform,
          `${applePlatform}.bitcode`,
          `No configuration named "${targetName}". Expected one of: ${names.join(', ')}.`
        );
      }
    }

    project.addBuildProperty('ENABLE_BITCODE', isBitcodeEnabled ? 'YES' : 'NO', targetName);

    return project;
  };
