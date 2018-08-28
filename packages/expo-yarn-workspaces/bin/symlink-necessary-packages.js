#!/usr/bin/env node
'use strict';

const debug = require('debug')('workspaces');
const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

/**
 * Creates symlinks for packages that some programs expect to be under the project's node_modules
 * directory rather than hoisted to the workspace root's.
 */
function symlinkNecessaryPackages(projectPath) {
  projectPath = path.resolve(projectPath);

  symlinkNecessaryPackage(projectPath, 'expo');
  symlinkNecessaryPackage(projectPath, 'react-native');
}

function symlinkNecessaryPackage(projectPath, packageName) {
  let nodeModulesPath = path.join(projectPath, 'node_modules');
  let packagePath = path.join(nodeModulesPath, packageName.replace('/', path.sep));
  debug(`Checking if %s is installed at %s`, packageName, packagePath);

  let stats = getFileStats(packagePath);
  if (stats) {
    debug(`%s is already installed in the project; skipping symlinking package`, packageName);
    if (!stats.isDirectory()) {
      console.warn(`%s is not a directory but is expected to contain a package`);
    }
    return;
  }

  let workspaceRootPath = findYarnWorkspaceRoot(projectPath);
  if (!workspaceRootPath) {
    debug(`Could not find Yarn workspace root; skipping symlinking package`);
  }
  let workspacePackagePath = path.join(
    workspaceRootPath,
    'node_modules',
    packageName.replace('/', path.sep)
  );

  if (packageName.startsWith('@')) {
    let [scope, name] = packageName.split('/');
    let scopePath = path.join(nodeModulesPath, scope);
    let relativePackagePath = path.relative(scopePath, workspacePackagePath);

    debug(`Ensuring %s exists`, scopePath);
    mkdirp.sync(scopePath);
    debug(`Creating symlink from %s to %s`, path.join(scopePath, name), relativePackagePath);
    fs.symlinkSync(relativePackagePath, path.join(scopePath, name));
  } else {
    let relativePackagePath = path.relative(nodeModulesPath, workspacePackagePath);
    console.log(relativePackagePath);

    debug(`Ensuring %s exists`, nodeModulesPath);
    mkdirp.sync(nodeModulesPath);
    debug(
      `Creating symlink from %s to %s`,
      path.join(nodeModulesPath, packageName),
      relativePackagePath
    );
    fs.symlinkSync(relativePackagePath, path.join(nodeModulesPath, packageName));
  }
}

function getFileStats(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
}

if (module === require.main) {
  symlinkNecessaryPackages(path.resolve());
}
