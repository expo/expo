// This file runs in Node.js environments.
// no relative imports
import { type RequireContext } from 'expo-router';
import { type RoutesManifest } from 'expo-server/private';

import { type Options, getRoutes } from './getRoutesSSR';
import { getServerManifest } from './getServerManifest';

export { Options };

function createMockContextModule(map: string[] = []) {
  const contextModule = (_key: string) => ({ default() {} });

  Object.defineProperty(contextModule, 'keys', {
    value: () => map,
  });

  return contextModule as RequireContext;
}

export function createRoutesManifest(
  paths: string[],
  options: Options
): RoutesManifest<string> | null {
  // TODO: Drop this part for Node.js
  const routeTree = getRoutes(createMockContextModule(paths), {
    ...options,
    preserveApiRoutes: true,
    preserveRedirectAndRewrites: true,
    ignoreRequireErrors: true,
    ignoreEntryPoints: true,
    platform: 'web',
  });

  if (!routeTree) {
    return null;
  }
  return getServerManifest(routeTree, { headers: options.headers });
}
