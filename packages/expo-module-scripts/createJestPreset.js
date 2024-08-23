'use strict';

const fs = require('fs');
const path = require('path');
const { resolveWorkspaceRoot } = require('resolve-workspace-root');

module.exports = function (basePreset) {
  // Explicitly catch and log errors since Jest sometimes suppresses error messages
  try {
    return _createJestPreset(basePreset);
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
    throw e;
  }
};

function getPlatformFromPreset(basePreset) {
  const haste = basePreset.haste || {};

  if (haste && haste.defaultPlatform) {
    if (!haste.defaultPlatform) {
      throw new Error(
        'Jest haste.defaultPlatform is not defined. Cannot determine the platform to bundle for.'
      );
    }
  }

  if (haste.defaultPlatform === 'node') {
    return { platform: 'web', isServer: true };
  } else if (haste.defaultPlatform === 'web') {
    if (basePreset.testEnvironment && basePreset.testEnvironment === 'node') {
      return { platform: 'web', isServer: true };
    } else {
      return { platform: 'web', isServer: false };
    }
  } else {
    return {
      platform: haste.defaultPlatform,
      // TODO: Account for react-server in the future.
      isServer: false,
    };
  }
}

function _createJestPreset(basePreset) {
  const { platform, isServer } = getPlatformFromPreset(basePreset);
  // Jest does not support chained presets so we flatten this preset before exporting it
  return {
    ...basePreset,
    clearMocks: true,
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          tsconfig: _createTypeScriptConfiguration(),
          babelConfig: {
            // NOTE: Assuming the default babel options will be enough to find the correct Babel config for testing.
            // https://babeljs.io/docs/options
            // We only need to set the caller so `babel-preset-expo` knows how to compile the project.
            caller: {
              name: 'metro',
              bundler: 'metro',
              // Add support for the `platform` babel transforms and inlines such as
              // Platform.OS and `process.env.EXPO_OS`.
              platform,
              // Add support for removing server related code from the bundle.
              isServer,
            },
          },
        },
      ],
      ...basePreset.transform,
    },
    // Add the React 19 workaround
    setupFiles: [...basePreset.setupFiles, require.resolve('./jest-setup-react-19.js')],
  };
}

function _createTypeScriptConfiguration() {
  const tsConfigFileName = 'tsconfig.json';
  // The path to tsconfig.json is resolved relative to cwd
  const tsConfigPath = path.resolve(tsConfigFileName);

  const jestTsConfigDirectory = path.join('.expo');
  const jestTsConfig = {
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

  const jestTsConfigJson = JSON.stringify(jestTsConfig, null, 2);
  // The TypeScript configuration needs to be under the project directory so that TypeScript finds
  // type declaration packages that are installed in the project or workspace root (writing it to a
  // temporary directory would not work, for example)
  const jestTsConfigPath = path.join(jestTsConfigDirectory, 'tsconfig.jest.json');

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
  const typeRoots = ['./node_modules/@types'];

  // If the TypeScript configuration is in a subdirectory of a package, find the package's directory
  // since find-yarn-workspace-root works only from workspace packages
  const packageDirectory = _findPackageDirectory(currentDirectory);
  if (!packageDirectory) {
    return typeRoots;
  }

  // If the TypeScript configuration is in a Yarn workspace, workspace's npm dependencies may be
  // installed in the workspace root. If the configuration is in a non-workspace package, its
  // dependencies are installed only in the package's directory.
  const rootPath = resolveWorkspaceRoot(packageDirectory) || packageDirectory;

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
