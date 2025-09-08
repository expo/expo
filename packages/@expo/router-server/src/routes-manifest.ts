// This file runs in Node.js environments.
// no relative imports
import type { RequireContext } from 'expo-router/build/types';

import { type Options, getRoutes } from './getRoutesSSR';
import { getServerManifest } from './getServerManifest';

export { Options };

export type RouteInfo<TRegex = string> = {
  file: string;
  page: string;
  namedRegex: TRegex;
  routeKeys: Record<string, string>;
  permanent?: boolean;
  methods?: string[];
};

export type MiddlewareInfo = {
  /**
   * Path to the module that contains the middleware function as a default export.
   *
   * @example _expo/functions/+middleware.js
   */
  file: string;
};

export type ExpoRoutesManifestV1<TRegex = string> = {
  middleware?: MiddlewareInfo;
  apiRoutes: RouteInfo<TRegex>[];
  htmlRoutes: RouteInfo<TRegex>[];
  notFoundRoutes: RouteInfo<TRegex>[];
  redirects: RouteInfo<TRegex>[];
  rewrites: RouteInfo<TRegex>[];
};

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
): ExpoRoutesManifestV1 | null {
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
  return getServerManifest(routeTree);
}
