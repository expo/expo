import type { UrlObject } from '../global-state/getRouteInfoFromState';
import { getSingularId } from '../utils/getSingularId';

/** Resolves the route context and current route info to the loader request/store key. */
export function resolveLoaderPath(contextKey: string, routeInfo: UrlObject | undefined): string {
  const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
  const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo?.params ?? {} })}`;
  const searchString = routeInfo?.searchParams?.toString() || '';

  return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
}
