import type { composeSourceMaps } from 'metro-source-map';
import os from 'os';
import resolveFrom from 'resolve-from';

// These resolvers enable us to test the CLI in older projects.
// We may be able to get rid of this in the future.
// TODO: Maybe combine with AsyncResolver?
class MetroImportError extends Error {
  constructor(projectRoot: string, moduleId: string) {
    super(
      `Missing package "${moduleId}" in the project at: ${projectRoot}\n` +
        'This usually means "react-native" is not installed. ' +
        'Please verify that dependencies in package.json include "react-native" ' +
        'and run `yarn` or `npm install`.'
    );
  }
}

function resolveFromProject(projectRoot: string, moduleId: string) {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}

function importFromProject(projectRoot: string, moduleId: string) {
  return require(resolveFromProject(projectRoot, moduleId));
}

export function importMetroServerFromProject(projectRoot: string): typeof import('metro').Server {
  return importFromProject(projectRoot, 'metro/src/Server');
}

/** Import `metro` from the project. */
export function importMetroFromProject(projectRoot: string): typeof import('metro') {
  return importFromProject(projectRoot, 'metro');
}

/** Import `@expo/metro-config` from the project. */
export function importExpoMetroConfigFromProject(
  projectRoot: string
): typeof import('@expo/metro-config') {
  return importFromProject(projectRoot, '@expo/metro-config');
}

/** Import `metro-resolver` from the project. */
export function importMetroResolverFromProject(
  projectRoot: string
): typeof import('metro-resolver') {
  return importFromProject(projectRoot, 'metro-resolver');
}

export function importCliServerApiFromProject(
  projectRoot: string
): typeof import('@react-native-community/cli-server-api') {
  return importFromProject(projectRoot, '@react-native-community/cli-server-api');
}

/**
 * Import the internal `saveAssets()` function from `react-native` for the purpose
 * of saving production assets as-is instead of converting them to a hash.
 */
export function importCliSaveAssetsFromProject(
  projectRoot: string
): typeof import('@react-native-community/cli-plugin-metro/build/commands/bundle/saveAssets').default {
  return importFromProject(
    projectRoot,
    '@react-native-community/cli-plugin-metro/build/commands/bundle/saveAssets'
  ).default;
}

export function importHermesCommandFromProject(projectRoot: string): string {
  const platformExecutable = getHermesCommandPlatform();
  const hermescLocations = [
    // Override hermesc dir by environment variables
    process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']
      ? `${process.env['REACT_NATIVE_OVERRIDE_HERMES_DIR']}/build/bin/hermesc`
      : '',

    // Building hermes from source
    'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc',

    // Prebuilt hermesc in official react-native 0.69+
    `react-native/sdks/hermesc/${platformExecutable}`,

    // Legacy hermes-engine package
    `hermes-engine/${platformExecutable}`,
  ];

  for (const location of hermescLocations) {
    try {
      return resolveFromProject(projectRoot, location);
    } catch {}
  }
  throw new Error('Cannot find the hermesc executable.');
}

function getHermesCommandPlatform(): string {
  switch (os.platform()) {
    case 'darwin':
      return 'osx-bin/hermesc';
    case 'linux':
      return 'linux64-bin/hermesc';
    case 'win32':
      return 'win64-bin/hermesc.exe';
    default:
      throw new Error(`Unsupported host platform for Hermes compiler: ${os.platform()}`);
  }
}

export function importMetroSourceMapComposeSourceMapsFromProject(
  projectRoot: string
): typeof composeSourceMaps {
  return importFromProject(projectRoot, 'metro-source-map/src/composeSourceMaps');
}
