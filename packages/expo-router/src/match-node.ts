import { findFocusedRoute } from './fork/findFocusedRoute';
import getStateFromPath, { getMatchableRouteConfigs } from './fork/getStateFromPath';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import { getRoutes } from './getRoutes';
import { RequireContext } from './types';

function createMockContextModule(map: string[]) {
  const contextModule = (key) => ({ default() {} });

  Object.defineProperty(contextModule, 'keys', {
    value: () => map,
  });

  return contextModule as unknown as RequireContext;
}

export function buildMatcher(
  filePaths: string[]
): (path: string) => null | ReturnType<typeof findFocusedRoute> {
  const ctx = createMockContextModule(filePaths);
  const routeTree = getRoutes(ctx, { preserveApiRoutes: true });

  // console.log("tree:", ctx, routeTree);
  if (!routeTree) {
    return () => null;
  }
  const config = getReactNavigationConfig(routeTree, false);

  return (path: string) => {
    const state = getStateFromPath(path, config);
    if (state) {
      return findFocusedRoute(state);
    }
    return null;
  };
}

type RoutesManifest = {
  regex: string;
  // original file path
  src: string;
}[];

export function createRoutesManifest(filePaths: string[]): RoutesManifest | null {
  const ctx = createMockContextModule(filePaths);
  const routeTree = getRoutes(ctx, { preserveApiRoutes: true });

  if (!routeTree) {
    return null;
  }

  const config = getReactNavigationConfig(routeTree, false);

  const { configs } = getMatchableRouteConfigs(config);

  const manifest: RoutesManifest = configs.map((config) => ({
    regex: config.regex!.toString(),
    src: config._route!.contextKey,
  }));

  return manifest;
}
