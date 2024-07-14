import { ExpoConfig } from '@expo/config-types';
import plist, { PlistObject } from '@expo/plist';
import assert from 'assert';
import fs from 'fs';
import xcode, { XCBuildConfiguration } from 'xcode';

import { InfoPlist } from './AppleConfig.types';
import { getAllInfoPlistPaths, getAllPBXProjectPaths, getPBXProjectPath } from './Paths';
import { findFirstNativeTarget, getXCBuildConfigurationFromPbxproj } from './Target';
import {
  ConfigurationSectionEntry,
  getBuildConfigurationsForListId,
  resolveXcodeBuildSetting,
} from './utils/Xcodeproj';
import { trimQuotes } from './utils/string';
import { ConfigPlugin, XcodeProject } from '../Plugin.types';
import { withXcodeProject } from '../plugins/apple-plugins';

export const withBundleIdentifier: (
  applePlatform: 'ios' | 'macos'
) => ConfigPlugin<{ bundleIdentifier?: string }> =
  (applePlatform: 'ios' | 'macos') =>
  (config, { bundleIdentifier }) => {
    return withXcodeProject(applePlatform)(config, async (config) => {
      const bundleId = bundleIdentifier ?? config[applePlatform]?.bundleIdentifier;
      // Should never happen.
      assert(
        bundleId,
        `\`bundleIdentifier\` must be defined in the app config (\`${applePlatform}.bundleIdentifier\`) or passed to the plugin \`withBundleIdentifier\`.`
      );

      config.modResults = updateBundleIdentifierForPbxprojObject(
        config.modResults,
        bundleId,
        false
      );

      return config;
    });
  };

const getBundleIdentifier =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>): string | null =>
    config[applePlatform]?.bundleIdentifier ?? null;

/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
const setBundleIdentifier =
  (applePlatform: 'ios' | 'macos') =>
  (config: ExpoConfig, infoPlist: InfoPlist): InfoPlist => {
    const bundleIdentifier = getBundleIdentifier(applePlatform)(config);

    if (!bundleIdentifier) {
      return infoPlist;
    }

    return {
      ...infoPlist,
      CFBundleIdentifier: bundleIdentifier,
    };
  };

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
const getBundleIdentifierFromPbxproj =
  (applePlatform: 'ios' | 'macos') =>
  (
    projectRoot: string,
    options: { targetName?: string; buildConfiguration?: string } = {}
  ): string | null => {
    const { targetName, buildConfiguration = 'Release' } = options;
    let pbxprojPath: string;
    try {
      pbxprojPath = getPBXProjectPath(applePlatform)(projectRoot);
    } catch {
      return null;
    }
    const project = xcode.project(pbxprojPath);
    project.parseSync();

    const xcBuildConfiguration = getXCBuildConfigurationFromPbxproj(project, {
      targetName,
      buildConfiguration,
    });
    if (!xcBuildConfiguration) {
      return null;
    }
    return getProductBundleIdentifierFromBuildConfiguration(xcBuildConfiguration);
  };

function getProductBundleIdentifierFromBuildConfiguration(
  xcBuildConfiguration: XCBuildConfiguration
): string | null {
  const bundleIdentifierRaw = xcBuildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
  if (bundleIdentifierRaw) {
    const bundleIdentifier = trimQuotes(bundleIdentifierRaw);
    return resolveXcodeBuildSetting(
      bundleIdentifier,
      (setting) => xcBuildConfiguration.buildSettings[setting] as string | undefined
    );
  } else {
    return null;
  }
}

/**
 * Updates the bundle identifier for a given pbxproj
 *
 * @param {string} pbxprojPath Path to pbxproj file
 * @param {string} bundleIdentifier Bundle identifier to set in the pbxproj
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
function updateBundleIdentifierForPbxproj(
  pbxprojPath: string,
  bundleIdentifier: string,
  updateProductName: boolean = true
): void {
  const project = xcode.project(pbxprojPath);
  project.parseSync();
  fs.writeFileSync(
    pbxprojPath,
    updateBundleIdentifierForPbxprojObject(project, bundleIdentifier, updateProductName).writeSync()
  );
}

/**
 * Updates the bundle identifier for a given pbxproj
 *
 * @param {string} project pbxproj file
 * @param {string} bundleIdentifier Bundle identifier to set in the pbxproj
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
function updateBundleIdentifierForPbxprojObject(
  project: XcodeProject,
  bundleIdentifier: string,
  updateProductName: boolean = true
) {
  const [, nativeTarget] = findFirstNativeTarget(project);

  getBuildConfigurationsForListId(project, nativeTarget.buildConfigurationList).forEach(
    ([, item]: ConfigurationSectionEntry) => {
      if (item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === bundleIdentifier) {
        return;
      }

      item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleIdentifier}"`;

      if (updateProductName) {
        const productName = bundleIdentifier.split('.').pop();
        if (!productName?.includes('$')) {
          item.buildSettings.PRODUCT_NAME = productName;
        }
      }
    }
  );
  return project;
}

/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
const setBundleIdentifierForPbxproj =
  (applePlatform: 'ios' | 'macos') =>
  (projectRoot: string, bundleIdentifier: string, updateProductName: boolean = true): void => {
    // Get all pbx projects in the ${projectRoot}/ios directory
    let pbxprojPaths: string[] = [];
    try {
      pbxprojPaths = getAllPBXProjectPaths(applePlatform)(projectRoot);
    } catch {}

    for (const pbxprojPath of pbxprojPaths) {
      updateBundleIdentifierForPbxproj(pbxprojPath, bundleIdentifier, updateProductName);
    }
  };

/**
 * Reset bundle identifier field in Info.plist to use PRODUCT_BUNDLE_IDENTIFIER, as recommended by Apple.
 */

const defaultBundleId = '$(PRODUCT_BUNDLE_IDENTIFIER)';

const resetAllPlistBundleIdentifiers =
  (applePlatform: 'ios' | 'macos') =>
  (projectRoot: string): void => {
    const infoPlistPaths = getAllInfoPlistPaths(applePlatform)(projectRoot);

    for (const plistPath of infoPlistPaths) {
      resetPlistBundleIdentifier(plistPath);
    }
  };

function resetPlistBundleIdentifier(plistPath: string): void {
  const rawPlist = fs.readFileSync(plistPath, 'utf8');
  const plistObject = plist.parse(rawPlist) as PlistObject;

  if (plistObject.CFBundleIdentifier) {
    if (plistObject.CFBundleIdentifier === defaultBundleId) return;

    // attempt to match default Info.plist format
    const format = { pretty: true, indent: `\t` };

    const xml = plist.build(
      {
        ...plistObject,
        CFBundleIdentifier: defaultBundleId,
      },
      format
    );

    if (xml !== rawPlist) {
      fs.writeFileSync(plistPath, xml);
    }
  }
}

export {
  getBundleIdentifier,
  setBundleIdentifier,
  getBundleIdentifierFromPbxproj,
  updateBundleIdentifierForPbxproj,
  setBundleIdentifierForPbxproj,
  resetAllPlistBundleIdentifiers,
  resetPlistBundleIdentifier,
};
