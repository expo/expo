// This file runs in Node.js environments.
// no relative imports
import { getRoutes as old_getRoutes } from './getRoutes';
import { getServerManifest } from './getServerManifest';
import { getRoutes as new_getRoutes } from './global-state/getRoutes';
import { RequireContext } from './types';

export type RouteInfo<TRegex = string> = {
  file: string;
  page: string;
  namedRegex: TRegex;
  routeKeys: { [named: string]: string };
};

export type ExpoRoutesManifestV1<TRegex = string> = {
  apiRoutes: RouteInfo<TRegex>[];
  htmlRoutes: RouteInfo<TRegex>[];
  notFoundRoutes: RouteInfo<TRegex>[];
};

function createMockContextModule(map: string[] = []) {
  const contextModule = (key) => ({ default() {} });

  Object.defineProperty(contextModule, 'keys', {
    value: () => map,
  });

  return contextModule as RequireContext;
}

export function createRoutesManifest(paths: string[]): ExpoRoutesManifestV1 | null {
  // TODO: Drop this part for Node.js
  const getRoutes =
    process.env.EXPO_ROUTER_UNSTABLE_GET_ROUTES ||
    process.env.EXPO_ROUTER_UNSTABLE_PLATFORM_EXTENSIONS
      ? new_getRoutes
      : old_getRoutes;

  const routeTree = getRoutes(createMockContextModule(paths), {
    preserveApiRoutes: true,
    ignoreRequireErrors: true,
    ignoreEntryPoints: true,
    unstable_platform: process.env.EXPO_ROUTER_UNSTABLE_PLATFORM_EXTENSIONS ? 'web' : undefined,
  });

  if (!routeTree) {
    return null;
  }
  return getServerManifest(routeTree);
}
