import type { RouteNode } from 'expo-router/internal/routing';
import { type RouteInfo, type RoutesManifest } from 'expo-server/private';

/**
 * Unified route information needed for loader execution
 */
export interface ResolvedLoaderRoute {
  /** Path to the route file (relative or absolute). For static routes, this will point to the parent dynamic route */
  file: string;
  /** The pathname being rendered */
  pathname: string;
  // TODO(@hassankhan): Rename `contextKey` property to `page`
  /** The context key for the route including unresolved parameters. For example, `/x/[y]/z` */
  contextKey: string;
  /** Extracted URL parameters */
  params: Record<string, string | string[]>;
}

type FromRuntimeManifestRouteOptions = {
  appDir: string;
  serverManifest: RoutesManifest<RegExp>;
};

/**
 * Converts a `RouteNode` to a `ResolvedLoaderRoute` object using runtime manifest lookup
 */
export function fromRuntimeManifestRoute(
  pathname: string,
  route: RouteNode,
  options: FromRuntimeManifestRouteOptions
): ResolvedLoaderRoute | null {
  // Skip internal routes (like `_sitemap` or `+not-found`)
  if (route.internal) {
    return null;
  }

  // For static routes that were generated from dynamic routes, we need to use the parent's
  // context key to find the loader
  // @see expo-router/src/loadStaticParamsAsync.ts
  const contextKey =
    route.dynamic === null && route.parentContextKey ? route.parentContextKey : route.contextKey;

  if (!contextKey) {
    return null;
  }

  // Find the server manifest route that matches this context key
  const serverManifestRoute = options.serverManifest.htmlRoutes.find((r) => r.file === contextKey);

  if (!serverManifestRoute) {
    return null;
  }

  return {
    file: serverManifestRoute.file,
    contextKey: serverManifestRoute.page,
    pathname,
    params: extractParams(pathname, serverManifestRoute),
  };
}

/**
 * Converts a `RouteInfo` to a `ResolvedLoaderRoute` object using server manifest lookup
 */
export function fromServerManifestRoute(
  pathname: string,
  route: RouteInfo<RegExp>
): ResolvedLoaderRoute | null {
  if (route.generated) {
    return null;
  }

  return {
    file: route.file,
    contextKey: route.page,
    pathname,
    params: extractParams(pathname, route),
  };
}

/**
 * Extract URL parameters from a pathname using a route's named regex
 */
function extractParams(
  pathname: string,
  route: RouteInfo<RegExp>
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const match = route.namedRegex.exec(pathname);
  if (match?.groups) {
    for (const [key, value] of Object.entries(match.groups)) {
      const namedKey = route.routeKeys[key];
      params[namedKey] = value;
    }
  }
  return params;
}
