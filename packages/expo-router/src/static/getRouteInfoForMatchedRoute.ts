import type { MatchedRoute } from 'expo-server/private';

import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import {
  getUrlWithReactNavigationConcessions,
  parseQueryParams,
  safelyDecodeURIComponent,
} from '../fork/getStateFromPath-forks';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { matchDynamicName } from '../matchers';

export type MatchedRouteParams = Record<string, string | string[]>;

/** The `pathname`, `params`, and `searchParams` for a route the server matched. */
export function getRouteInfoForMatchedRoute(
  route: Pick<MatchedRoute, 'page' | 'generated'>,
  params: MatchedRouteParams,
  location: URL
) {
  const path = `${location.pathname}${location.search}`;
  const routeInfo = getRouteInfoFromState(
    route.generated
      ? createGeneratedRouteState(route.page, path)
      : createMatchedRouteState(route.page, params, path)
  );
  return {
    pathname: routeInfo.pathname,
    params: routeInfo.params,
    searchParams: routeInfo.searchParams,
  };
}

/** The state `getStateFromPath` produces for a route file. */
function createMatchedRouteState(page: string, params: MatchedRouteParams, path: string) {
  const name = page.replace(/^\//, '');
  const pathParams = decodePathParams(name, params);
  const queryParams = parseQueryParams(path, { name, params: pathParams });
  return {
    routes: [
      {
        name: INTERNAL_SLOT_NAME,
        state: { routes: [{ name, params: { ...pathParams, ...queryParams } }] },
      },
    ],
  };
}

/** The root-level state `getStateFromPath` produces for generated routes. */
function createGeneratedRouteState(page: string, path: string) {
  const name = page === `/${SITEMAP_ROUTE_NAME}` ? SITEMAP_ROUTE_NAME : NOT_FOUND_ROUTE_NAME;
  return { routes: [{ name, path: getUrlWithReactNavigationConcessions(path).pathWithoutGroups }] };
}

/** @see import('../fork/getStateFromPath').matchAgainstConfigs */
function decodePathParams(name: string, captures: MatchedRouteParams) {
  const params: MatchedRouteParams = {};
  for (const segment of name.split('/')) {
    const dynamic =
      segment === '+not-found' ? { name: 'not-found', deep: true } : matchDynamicName(segment);
    const value = dynamic ? captures[dynamic.name] : undefined;
    if (!dynamic || value == null) {
      continue;
    }
    const decoded = (Array.isArray(value) ? value : [value])
      .map(safelyDecodeURIComponent)
      .join('/');
    params[dynamic.name] = dynamic.deep ? decoded.split('/').filter(Boolean) : decoded;
  }
  return params;
}
