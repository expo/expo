import path from 'path';
import resolveFrom from 'resolve-from';

const debug = require('debug')('expo:start:server:metro:router') as typeof console.log;

/**
 * Get the relative path for requiring the `/app` folder relative to the `expo-router/entry` file.
 * This mechanism does require the server to restart after the `expo-router` package is installed.
 */
export function getAppRouterRelativeEntryPath(projectRoot: string): string | undefined {
  // Auto pick App entry
  const routerEntry =
    resolveFrom.silent(projectRoot, 'expo-router/entry') ?? getFallbackEntryRoot(projectRoot);
  if (!routerEntry) {
    return undefined;
  }
  // It doesn't matter if the app folder exists.
  const appFolder = path.join(projectRoot, 'app');
  const appRoot = path.relative(path.dirname(routerEntry), appFolder);
  debug('routerEntry', routerEntry, appFolder, appRoot);
  return appRoot;
}

/** If the `expo-router` package is not installed, then use the `expo` package to determine where the node modules are relative to the project. */
function getFallbackEntryRoot(projectRoot: string): string {
  const expoRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  if (expoRoot) {
    return path.join(path.dirname(path.dirname(expoRoot)), 'expo-router/entry');
  }
  return path.join(projectRoot, 'node_modules/expo-router/entry');
}

export function getExpoRouterRootDirectory(projectRoot: string): string {
  return path.join(projectRoot, 'app');
}
