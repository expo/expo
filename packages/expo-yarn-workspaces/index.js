'use strict';

const { getDefaultConfig } = require('@expo/metro-config');
const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const path = require('path');

const getSymlinkedNodeModulesForDirectory = require('./common/get-symlinked-modules');

/**
 * Returns a configuration object in the format expected for "metro.config.js" files. The
 * configuration:
 *
 *   * includes the Yarn workspace root in Metro's list of root directories
 *   * resolves symlinked packages, namely workspaces
 *   * excludes all modules from Haste's module system (providesModule)
 *   * excludes modules in the native Android and Xcode projects
 */
exports.createMetroConfiguration = function createMetroConfiguration(projectPath, options) {
  projectPath = path.resolve(projectPath);
  debug(`Creating a Metro configuration for the project at %s`, projectPath);
  const {
    // Remove the React Native reporter.
    reporter,
    ...defaultConfig
  } = getDefaultConfig(projectPath, options);

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
      assetExts: [...defaultConfig.resolver.assetExts, 'db'],

      // Include .cjs files
      sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],

      nodeModulesPaths: [
        ...defaultConfig.resolver.nodeModulesPaths,
        path.join(projectPath, 'modules'),
      ],

      // Make the symlinked packages visible to Metro
      extraNodeModules,

      // Use Node-style module resolution instead of Haste everywhere
      providesModuleNodeModules: [],

      // Ignore test files and JS files in the native Android and Xcode projects
      blockList: [
        /\/__tests__\/.*/,
        /.*\/android\/React(Android|Common)\/.*/,
        /.*\/versioned-react-native\/.*/,
      ],
    },

    transformer: {
      ...defaultConfig.transformer,
      // Ignore file-relative Babel configurations and apply only the project's
      enableBabelRCLookup: false,
    },
  };
};
