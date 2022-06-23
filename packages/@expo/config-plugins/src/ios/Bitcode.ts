import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';

import { ConfigPlugin } from '../Plugin.types';
import { withXcodeProject } from '../plugins/ios-plugins';
import { addWarningIOS } from '../utils/warnings';
import { isNotComment } from './utils/Xcodeproj';

type Bitcode = NonNullable<ExpoConfig['ios']>['bitcode'];

/**
 * Plugin to set a bitcode preference for the Xcode project
 * based on the project's Expo config `ios.bitcode` value.
 */
export const withBitcode: ConfigPlugin = config => {
  return withXcodeProject(config, async config => {
    config.modResults = await setBitcodeWithConfig(config, {
      project: config.modResults,
    });
    return config;
  });
};

/**
 * Plugin to set a custom bitcode preference for the Xcode project.
 * Does not read from the Expo config `ios.bitcode`.
 *
 * @param bitcode custom bitcode setting.
 */
export const withCustomBitcode: ConfigPlugin<Bitcode> = (config, bitcode) => {
  return withXcodeProject(config, async config => {
    config.modResults = await setBitcode(bitcode, {
      project: config.modResults,
    });
    return config;
  });
};

/**
 * Get the bitcode preference from the Expo config.
 */
export function getBitcode(config: Pick<ExpoConfig, 'ios'>): Bitcode {
  return config.ios?.bitcode;
}

/**
 * Enable or disable the `ENABLE_BITCODE` property of the project configurations.
 */
export function setBitcodeWithConfig(
  config: Pick<ExpoConfig, 'ios'>,
  { project }: { project: XcodeProject }
): XcodeProject {
  const bitcode = getBitcode(config);
  return setBitcode(bitcode, { project });
}

/**
 * Enable or disable the `ENABLE_BITCODE` property.
 */
export function setBitcode(bitcode: Bitcode, { project }: { project: XcodeProject }): XcodeProject {
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
    const hasConfiguration = configs.find(([, configuration]) => configuration.name === targetName);
    if (hasConfiguration) {
      // If targetName is defined then disable bitcode everywhere.
      project.addBuildProperty('ENABLE_BITCODE', 'NO');
    } else {
      const names = [
        // Remove duplicates, wrap in double quotes, and sort alphabetically.
        ...new Set(configs.map(([, configuration]) => `"${configuration.name}"`)),
      ].sort();
      addWarningIOS(
        'ios.bitcode',
        `No configuration named "${targetName}". Expected one of: ${names.join(', ')}.`
      );
    }
  }

  project.addBuildProperty('ENABLE_BITCODE', isBitcodeEnabled ? 'YES' : 'NO', targetName);

  return project;
}
