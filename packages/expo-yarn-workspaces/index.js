'use strict';

const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const fs = require('fs');
const { getDefaultConfig } = require('@expo/metro-config');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
// TODO: Use the vendored metro config in a future version after SDK 41 is released
// const { getDefaultConfig } = require('expo/metro-config');
const blacklist = require('metro-config/src/defaults/blacklist');
const { assetExts } = require('metro-config/src/defaults/defaults');
const path = require('path');

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

  let workspaceRootPath = findYarnWorkspaceRoot(projectPath);
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
      blacklistRE: blacklist([
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



/**
 * Returns a webpack configuration object that:
 * 
 *    * transpiles symlinked workspace packages
 *    * watches for file changes in symlinked workspace packages
 */
exports.createWebpackConfigAsync = async function createWebpackConfigAsync(env, argv) {
  let workspacePackagesToTranspile = [];
  let workspaceRootPath = findYarnWorkspaceRoot(env.projectRoot);

  if (workspaceRootPath) {
    debug(`Found Yarn workspace root at %s`, workspaceRootPath);

    const symlinkedModules = getSymlinkedNodeModulesForDirectory(workspaceRootPath);
    const symlinkedModulePaths = Object.values(symlinkedModules)
    let workspacePackage = require(path.resolve(workspaceRootPath, 'package.json'));

    // determine if any symlinked modules are a workspace package and include them to be transpiled
    for (let workspaceGlob of workspacePackage.workspaces) {
      const workspaceName = workspaceGlob.split('*')[0];
      const workspacePath = path.resolve(workspaceRootPath, workspaceName);

      for (let actualModulePath of symlinkedModulePaths) {
        if (isSubDirectory(workspacePath, actualModulePath)) {
          workspacePackagesToTranspile.push(actualModulePath);
        }
      }
    }
  } else {
    debug(`Could not find Yarn workspace root`);
  }

  env.babel = env.babel ?? {};

  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          ...workspacePackagesToTranspile,
          ...(env.babel.dangerouslyAddModulePathsToTranspile ?? []),
        ],
      },
    },
    argv
  );

  // use symlink resolution so that webpack watches package file changes
  config.resolve.symlinks = true;

  return config;
};

/**
 * Returns a mapping from the names of symlinked packages to the physical paths of each package.
 */
function getSymlinkedNodeModulesForDirectory(packagePath) {
  let nodeModulesPath = path.join(packagePath, 'node_modules');
  let directories = listDirectoryContents(nodeModulesPath);

  let modules = {};
  for (let directory of directories) {
    // The directory is either a scope or a package
    if (directory.startsWith('@')) {
      let scopePath = path.join(nodeModulesPath, directory);
      let scopedPackageDirectories = fs.readdirSync(scopePath);
      for (let subdirectory of scopedPackageDirectories) {
        let dependencyName = `${directory}/${subdirectory}`;
        let dependencyPath = path.join(scopePath, subdirectory);
        if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
          modules[dependencyName] = fs.realpathSync(dependencyPath);
        }
      }
    } else {
      let dependencyName = directory;
      let dependencyPath = path.join(nodeModulesPath, directory);
      if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
        modules[dependencyName] = fs.realpathSync(dependencyPath);
      }
    }
  }
  return modules;
}

function listDirectoryContents(directory) {
  try {
    return fs.readdirSync(directory);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
    throw e;
  }
}

function isSubDirectory(parent, child) {
  const relative = path.relative(parent, child);
  const isSubdir = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  return isSubdir;
}
