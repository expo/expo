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

/** Import `metro` from the project. */
export function importMetroFromProject(projectRoot: string): typeof import('metro') {
  return importFromProject(projectRoot, 'metro');
}
export function importMetroInspectorProxyFromProject(
  projectRoot: string
): typeof import('metro-inspector-proxy') {
  return importFromProject(projectRoot, 'metro-inspector-proxy');
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
