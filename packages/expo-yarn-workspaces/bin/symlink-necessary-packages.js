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
  // Required for bare workflow gradle and Podfile imports which don't have access to node module resolution.
  symlinkNecessaryPackage(projectPath, 'jsc-android');
  symlinkNecessaryPackage(projectPath, 'hermes-engine');
  symlinkNecessaryPackage(projectPath, 'react-native-unimodules');
  symlinkNecessaryPackage(projectPath, '@react-native-community/cli-platform-ios');
  symlinkNecessaryPackage(projectPath, '@react-native-community/cli-platform-android');

  const packageJson = getProjectPackageJson(projectPath);

  const workspace = packageJson['expo-yarn-workspaces'] || {};
  const symlinks = workspace.symlinks || [];
  debug(`Project defined symlinks`, symlinks);

  for (const symlink of symlinks) {
    if (typeof symlink === 'string') {
      symlinkNecessaryPackage(projectPath, symlink);
    }
  }
}

function getProjectPackageJson(projectPath) {
  try {
    const contents = fs.readFileSync(path.join(projectPath, 'package.json'));
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

function symlinkNecessaryPackage(projectPath, packageName) {
  const nodeModulesPath = path.join(projectPath, 'node_modules');
  const packagePath = path.join(nodeModulesPath, packageName.replace('/', path.sep));
  debug(`Checking if %s is installed at %s`, packageName, packagePath);

  let stats = getFileStats(packagePath);
  if (stats) {
    debug(`%s is already installed in the project; skipping symlinking package`, packageName);
    if (!stats.isDirectory()) {
      console.warn(`%s is not a directory but is expected to contain a package`);
    }
    return;
  }

  const workspaceRootPath = findYarnWorkspaceRoot(projectPath);
  if (!workspaceRootPath) {
    debug(`Could not find Yarn workspace root; skipping symlinking package`);
    return;
  }
  const workspacePackagePath = path.join(
    workspaceRootPath,
    'node_modules',
    packageName.replace('/', path.sep)
  );

  stats = getFileStats(workspacePackagePath);
  if (!stats || !stats.isDirectory()) {
    debug(`%s does not exist; skipping symlinking package`, workspacePackagePath);
    return;
  }

  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/');
    const scopePath = path.join(nodeModulesPath, scope);
    const relativePackagePath = path.relative(scopePath, workspacePackagePath);

    debug(`Ensuring %s exists`, scopePath);
    mkdirp.sync(scopePath);
    debug(`Creating symlink from %s to %s`, path.join(scopePath, name), relativePackagePath);
    fs.symlinkSync(relativePackagePath, path.join(scopePath, name), 'junction');
  } else {
    const relativePackagePath = path.relative(nodeModulesPath, workspacePackagePath);

    debug(`Ensuring %s exists`, nodeModulesPath);
    mkdirp.sync(nodeModulesPath);
    debug(
      `Creating symlink from %s to %s`,
      path.join(nodeModulesPath, packageName),
      relativePackagePath
    );
    fs.symlinkSync(relativePackagePath, path.join(nodeModulesPath, packageName), 'junction');
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
