// This file runs in Node.js environments.
// no relative imports
import { getServerManifest } from './getMatchableManifest';
import { getRoutes } from './getRoutes';
import { RequireContext } from './types';

export type RouteInfo<TRegex = string> = {
  page: string;
  namedRegex: TRegex;
  routeKeys: { [named: string]: string };
};

export type ExpoRoutesManifestV1<TRegex = string> = {
  dynamicRoutes: RouteInfo<TRegex>[];
  staticRoutes: RouteInfo<TRegex>[];
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
  const routeTree = getRoutes(createMockContextModule(paths), {
    preserveApiRoutes: true,
    ignoreRequireErrors: true,
  });

  if (!routeTree) {
    return null;
  }
  return getServerManifest(routeTree);
}
