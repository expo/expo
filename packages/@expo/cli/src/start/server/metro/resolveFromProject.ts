import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:metro:import');

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

export function importCliServerApiFromProject(
  projectRoot: string
): typeof import('@react-native-community/cli-server-api') {
  return importFromProject(projectRoot, '@react-native-community/cli-server-api');
}

export function importMetroSourceMapComposeSourceMapsFromProject(
  projectRoot: string
): typeof import('metro-source-map').composeSourceMaps {
  return importFromProject(projectRoot, 'metro-source-map/src/composeSourceMaps');
}

export function resolveFromProject(projectRoot: string, moduleId: string) {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}

function importFromProject(projectRoot: string, moduleId: string) {
  return require(resolveFromProject(projectRoot, moduleId));
}

/** Import `metro` from the project. */
export function importMetroFromProject(projectRoot: string): typeof import('metro') {
  return importFromProject(projectRoot, 'metro');
}
export function importMetroServerFromProject(projectRoot: string): typeof import('metro').Server {
  return importFromProject(projectRoot, 'metro/src/Server');
}
export function importMetroCreateWebsocketServerFromProject(
  projectRoot: string
): typeof import('metro/src/lib/createWebsocketServer').createWebsocketServer {
  return importFromProject(projectRoot, 'metro/src/lib/createWebsocketServer');
}
export function importMetroHmrServerFromProject(
  projectRoot: string
): typeof import('metro/src/HmrServer').MetroHmrServer {
  return importFromProject(projectRoot, 'metro/src/HmrServer');
}

export function importExpoMetroConfig(projectRoot: string) {
  return importFromProjectOrFallback<typeof import('@expo/metro-config')>(
    projectRoot,
    '@expo/metro-config'
  );
}

/**
 * Attempt to use the local version of a module or fallback on the CLI version.
 * This should only ever happen when testing Expo CLI in development.
 */
export function importFromProjectOrFallback<TModule>(
  projectRoot: string,
  moduleId: string
): TModule {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    debug(`requiring "${moduleId}" relative to the CLI`);
    return require(require.resolve(moduleId));
  }
  debug(`requiring "${moduleId}" from the project:`, resolvedPath);
  return require(resolvedPath);
}

/** Import `metro-resolver` from the project. */
export function importMetroResolverFromProject(
  projectRoot: string
): typeof import('metro-resolver') {
  return importFromProject(projectRoot, 'metro-resolver');
}

/** Import `metro-inspector-proxy` from the project. */
export function importMetroInspectorProxyFromProject(
  projectRoot: string
): typeof import('metro-inspector-proxy') {
  return importFromProject(projectRoot, 'metro-inspector-proxy');
}

/** Import `metro-inspector-proxy/src/Device` from the project. */
export function importMetroInspectorDeviceFromProject(
  projectRoot: string
): typeof import('metro-inspector-proxy/src/Device') {
  return importFromProject(projectRoot, 'metro-inspector-proxy/src/Device');
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

/** Resolve the installed Metro version from project */
export function resolveMetroVersionFromProject(projectRoot: string): string {
  return importFromProject(projectRoot, 'metro/package.json').version;
}
