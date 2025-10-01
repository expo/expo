import type { RouteNode } from 'expo-router/build/Route';
import { type RouteInfo, type RoutesManifest } from 'expo-server/private';

/**
 * Unified route information needed for loader execution
 */
export interface ResolvedLoaderRoute {
  /** Path to the route file (relative or absolute). For static routes, this will point to the parent dynamic route */
  file: string;
  /** The pathname being rendered */
  pathname: string;
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
  if (route.generated) {
    return null;
  }

  // TODO(@hassankhan): Add safety check here
  const relativeFile = route.entryPoints.at(-1).replace(options.appDir, '');
  const parentPath = relativeFile.replace(/\.[j|t]s(x)?/, '');

  const parentManifestRoute = options.serverManifest.htmlRoutes.find((r) =>
    r.namedRegex.test(parentPath)
  );

  if (!parentManifestRoute) {
    return null;
  }

  return {
    file: `.${relativeFile}`,
    pathname,
    params: extractParams(pathname, parentManifestRoute),
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
