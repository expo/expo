'use strict';

const { getDefaultConfig } = require('@expo/metro-config');
const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
// TODO: Use the vendored metro config in a future version after SDK 41 is released
// const { getDefaultConfig } = require('expo/metro-config');
const { assetExts } = require('metro-config/src/defaults/defaults');
const path = require('path');

const getSymlinkedNodeModulesForDirectory = require('./common/get-symlinked-modules');

let exclusionList;
try {
  // blacklist was removed in the metro-config version used by
  // react-native@0.64, but the interface is the same as the replacement,
  // exclusionList, so we can use blacklist if it's available and otherwise
  // use exclusionList.
  exclusionList = require('metro-config/src/defaults/blacklist');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }

  // Require exclusionList after attempting to load blacklist, so if an error is
  // thrown then it is the same as if we only required exclusionList.
  exclusionList = require('metro-config/src/defaults/exclusionList');
}

/**
 * Returns a configuration object in the format expected for "metro.config.js" files. The
 * configuration:
 *
 *   * includes the Yarn workspace root in Metro's list of root directories
 *   * resolves symlinked packages, namely workspaces
 *   * excludes all modules from Haste's module system (providesModule)
 *   * excludes modules in the native Android and Xcode projects
 */
exports.createMetroConfiguration = function createMetroConfiguration(projectPath) {
  projectPath = path.resolve(projectPath);
  debug(`Creating a Metro configuration for the project at %s`, projectPath);
  const {
    // Remove the React Native reporter.
    reporter,
    ...defaultConfig
  } = getDefaultConfig(projectPath);

  let watchFolders;
  let extraNodeModules;

  const workspaceRootPath = findYarnWorkspaceRoot(projectPath);
  if (workspaceRootPath) {
    debug(`Found Yarn workspace root at %s`, workspaceRootPath);
    watchFolders = [workspaceRootPath];
    extraNodeModules = {
      ...getSymlinkedNodeModulesForDirectory(workspaceRootPath),
      ...getSymlinkedNodeModulesForDirectory(projectPath),
    };
  } else {
    debug(`Could not find Yarn workspace root`);
    watchFolders = [];
    extraNodeModules = getSymlinkedNodeModulesForDirectory(projectPath);
  }

  return {
    ...defaultConfig,
    // Search for modules from the project's root directory
    projectRoot: projectPath,

    // Include npm packages from the workspace root, where packages are hoisted
    watchFolders,
    resolver: {
      ...defaultConfig.resolver,
      // test-suite includes a db asset
      assetExts: [...assetExts, 'db'],

      // Make the symlinked packages visible to Metro
      extraNodeModules,

      // Use Node-style module resolution instead of Haste everywhere
      providesModuleNodeModules: [],

      // Ignore JS files in the native Android and Xcode projects
      blacklistRE: exclusionList([
        /.*\/android\/React(Android|Common)\/.*/,
        /.*\/versioned-react-native\/.*/,
      ]),
    },

    transformer: {
      ...defaultConfig.transformer,
      // Ignore file-relative Babel configurations and apply only the project's
      enableBabelRCLookup: false,
    },
  };
};
