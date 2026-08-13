import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { getSingularId } from '../utils/getSingularId';

/** Resolves the route context and navigation state to the loader request/store key. */
export function resolveLoaderPath(
  contextKey: string,
  stateForPath: Parameters<typeof getRouteInfoFromState>[0]
): string {
  const routeInfo = getRouteInfoFromState(stateForPath);
  const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
  const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
  const searchString = routeInfo.searchParams?.toString() || '';

  return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
}
