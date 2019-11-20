'use strict';

const findYarnWorkspaceRoot = require('find-yarn-workspace-root');
const fs = require('fs');
const path = require('path');
const { jsWithBabel: tsJestPreset } = require('ts-jest/presets');

module.exports = function(basePreset) {
  // Explicitly catch and log errors since Jest sometimes suppresses error messages
  try {
    return _createJestPreset(basePreset);
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
    throw e;
  }
};

function _createJestPreset(basePreset) {
  // Jest does not support chained presets so we flatten this preset before exporting it
  return {
    ...basePreset,
    clearMocks: true,
    roots: ['<rootDir>/src'],
    transform: {
      ...tsJestPreset.transform,
      ...basePreset.transform,
    },
    globals: {
      'ts-jest': {
        tsConfig: _createTypeScriptConfiguration(),
        babelConfig: _createBabelConfiguration(),
      },
    },
  };
}

function _createBabelConfiguration() {
  // "true" signals that ts-jest should use Babel's default configuration lookup, which will use the
  // configuration file written above
  return true;
}

function _createTypeScriptConfiguration() {
  let tsConfigFileName = 'tsconfig.json';
  // The path to tsconfig.json is resolved relative to cwd
  let tsConfigPath = path.resolve(tsConfigFileName);

  let jestTsConfigDirectory = path.join('.expo');
  let jestTsConfig = {
    extends: tsConfigPath,
    compilerOptions: {
      // Explicitly specify "module" so that ts-jest doesn't provide its default
      module: 'esnext',
      // Explicitly specify all the "node_modules/@types" paths up to the workspace or package root
      typeRoots: [
        ..._getDefaultTypeRoots(jestTsConfigDirectory),
        path.join(__dirname, 'ts-declarations'),
      ],
    },
  };

  let jestTsConfigJson = JSON.stringify(jestTsConfig, null, 2);
  // The TypeScript configuration needs to be under the project directory so that TypeScript finds
  // type declaration packages that are installed in the project or workspace root (writing it to a
  // temporary directory would not work, for example)
  let jestTsConfigPath = path.join(jestTsConfigDirectory, 'tsconfig.jest.json');

  // NOTE: remove this existsSync call once we require Node 10.12+
  if (!fs.existsSync(jestTsConfigPath)) {
    fs.mkdirSync(path.dirname(jestTsConfigPath), { recursive: true });
  }
  fs.writeFileSync(jestTsConfigPath, jestTsConfigJson);
  return jestTsConfigPath;
}

/**
 * By default, TypeScript looks for type declarations in "node_modules/@types" of the current
 * directory and all ancestor directories. When overriding the "typeRoots" option, TypeScript no
 * longer follows this algorithm and we need to re-implement the default behavior. This function
 * returns the default type roots that TypeScript would have used, except we stop at the workspace
 * root for better isolation.
 */
function _getDefaultTypeRoots(currentDirectory) {
  currentDirectory = path.resolve(currentDirectory);
  let typeRoots = ['./node_modules/@types'];

  // If the TypeScript configuration is in a subdirectory of a package, find the package's directory
  // since find-yarn-workspace-root works only from workspace packages
  let packageDirectory = _findPackageDirectory(currentDirectory);
  if (!packageDirectory) {
    return typeRoots;
  }

  let workspaceRootPath = findYarnWorkspaceRoot(packageDirectory);

  // If the TypeScript configuration is in a Yarn workspace, workspace's npm dependencies may be
  // installed in the workspace root. If the configuration is in a non-workspace package, its
  // dependencies are installed only in the package's directory.
  let rootPath = workspaceRootPath || packageDirectory;

  let relativeAncestorDirectoryPath = '..';
  while (currentDirectory !== rootPath) {
    typeRoots.push(path.join(relativeAncestorDirectoryPath, 'node_modules/@types'));
    currentDirectory = path.dirname(currentDirectory);
    relativeAncestorDirectoryPath = path.join(relativeAncestorDirectoryPath, '..');
  }

  return typeRoots;
}

function _findPackageDirectory(currentDirectory) {
  while (currentDirectory !== path.dirname(currentDirectory)) {
    if (fs.existsSync(path.join(currentDirectory, 'package.json'))) {
      return currentDirectory;
    }
    currentDirectory = path.dirname(currentDirectory);
  }
  return null;
}
