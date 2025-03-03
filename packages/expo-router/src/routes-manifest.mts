// This file runs in Node.js environments.
// no relative imports
import { type Options, getRoutes } from './getRoutesSSR.mjs';
import { getServerManifest } from './getServerManifest.mjs';
import type { RequireContext } from './types';

export { Options } from './getRoutes.mjs';

export type RouteInfo<TRegex = string> = {
  file: string;
  page: string;
  namedRegex: TRegex;
  routeKeys: Record<string, string>;
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

export function createRoutesManifest(
  paths: string[],
  options: Options
): ExpoRoutesManifestV1 | null {
  // TODO: Drop this part for Node.js
  const routeTree = getRoutes(createMockContextModule(paths), {
    ...options,
    preserveApiRoutes: true,
    ignoreRequireErrors: true,
    ignoreEntryPoints: true,
    platform: 'web',
  });

  if (!routeTree) {
    return null;
  }
  return getServerManifest(routeTree);
}
