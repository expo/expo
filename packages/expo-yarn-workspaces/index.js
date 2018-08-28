'use strict';

const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const fs = require('fs');
const blacklist = require('metro/src/blacklist');
const path = require('path');

/**
 * Returns a configuration object in the format expected for "rn-cli.config.js" files. The
 * configuration:
 *
 *   * includes the Yarn workspace root in Metro's list of root directories
 *   * resolves symlinked packages, namely workspaces 
 *   * excludes all modules from Haste's module system (providesModule)
 *   * excludes modules in the native Android and Xcode projects
 */
exports.createReactNativeConfiguration = function createReactNativeConfiguration(projectPath) {
  projectPath = path.resolve(projectPath);
  debug(`Creating a React Native configuration for the project at %s`, projectPath);

  let projectRoots;
  let extraNodeModules;

  let workspaceRootPath = findYarnWorkspaceRoot(projectPath);
  if (workspaceRootPath) {
    debug(`Found Yarn workspace root at %s`, workspaceRootPath);
    projectRoots = [projectPath, workspaceRootPath];
    extraNodeModules = {
      ...getSymlinkedNodeModulesForDirectory(workspaceRootPath),
      ...getSymlinkedNodeModulesForDirectory(projectPath),
    };
  } else {
    debug(`Could not find Yarn workspace root`);
    projectRoots = [projectPath];
    extraNodeModules = getSymlinkedNodeModulesForDirectory(projectPath);
  }

  return {
    // Include npm packages from the project and the workspace root, where packages are hoisted
    getProjectRoots() {
      return projectRoots;
    },

    // Make the symlinked packages visible to Metro
    extraNodeModules,

    // Use Node-style module resolution instead of Haste everywhere
    getProvidesModuleNodeModules() {
      return [];
    },

    // Ignore JS files in the native Android and Xcode projects
    getBlacklistRE() {
      return blacklist([
        /.*\/android\/ReactAndroid\/.*/,
        /.*\/versioned-react-native\/.*/,
      ]);
    },
  };
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
