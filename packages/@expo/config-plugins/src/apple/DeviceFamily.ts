import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';

import { ConfigPlugin } from '../Plugin.types';
import { withXcodeProject } from '../plugins/apple-plugins';
import { addWarningForPlatform } from '../utils/warnings';

export const withDeviceFamily: (applePlatform: 'ios' | 'macos') => ConfigPlugin =
  (applePlatform: 'ios' | 'macos') => (config) => {
    return withXcodeProject(applePlatform)(config, async (config) => {
      config.modResults = await setDeviceFamily(applePlatform)(config, {
        project: config.modResults,
      });
      return config;
    });
  };

export const getSupportsTablet =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>): boolean =>
    !!config[applePlatform]?.supportsTablet;

export const getIsTabletOnly =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>): boolean =>
    !!config?.[applePlatform]?.isTabletOnly;

export const getDeviceFamilies =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>): number[] => {
    const supportsTablet = getSupportsTablet(applePlatform)(config);
    const isTabletOnly = getIsTabletOnly(applePlatform)(config);

    if (isTabletOnly && config[applePlatform]?.supportsTablet === false) {
      addWarningForPlatform(
        applePlatform,
        `${applePlatform}.supportsTablet`,
        `Found contradictory values: \`{ ${applePlatform}: { isTabletOnly: true, supportsTablet: false } }\`. Using \`{ isTabletOnly: true }\`.`
      );
    }

    // 1 is iPhone, 2 is iPad
    if (isTabletOnly) {
      return [2];
    } else if (supportsTablet) {
      return [1, 2];
    } else {
      // is iPhone only
      return [1];
    }
  };

/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
export function formatDeviceFamilies(deviceFamilies: number[]): string {
  return `"${deviceFamilies.join(',')}"`;
}

/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
export const setDeviceFamily =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    { project }: { project: XcodeProject }
  ): XcodeProject => {
    const deviceFamilies = formatDeviceFamilies(getDeviceFamilies(applePlatform)(config));

    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
      // Guessing that this is the best way to emulate Xcode.
      // Using `project.addToBuildSettings` modifies too many targets.
      if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
        if (typeof buildSettings?.TVOS_DEPLOYMENT_TARGET !== 'undefined') {
          buildSettings.TARGETED_DEVICE_FAMILY = '3';
        } else {
          buildSettings.TARGETED_DEVICE_FAMILY = deviceFamilies;
        }
      }
    }

    return project;
  };
