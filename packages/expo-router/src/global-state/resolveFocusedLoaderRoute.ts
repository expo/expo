import type { RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from '../constants';
import { resolveLoaderKey } from '../loaders/resolveLoaderKey';
import { getContextKey } from '../matchers';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import type { ReactNavigationState } from './types';

export type ActiveLoaderRoute = {
  /** Resolved URL (pathname + search) — the loader cache key. */
  resolvedPath: string;
  // routeKey: string; // per-instance React Navigation route.key — re-enable for the revalidation follow-up.
  /** Normalized context key, matching `useContextKey()`. */
  contextKey: string;
  params: Record<string, string | string[]>;
  searchParams: URLSearchParams;
  loadRoute: RouteNode['loadRoute'];
};

/** Focused route at a navigator level, matching `getRouteInfoFromState`'s index selection. */
function focusedRoute(state: { index?: number; routes: any[] }) {
  return state.routes['index' in state && typeof state.index === 'number' ? state.index : 0];
}

/**
 * Resolve the focused leaf route to warm for a just-committed navigation state, or `null` if there
 * is nothing to warm (no loader, a special route, or no matching `RouteNode`).
 *
 * Only leaf routes can export loaders, so the focused branch has at most one. `getRouteInfoFromState`
 * gives params/search; a parallel `RouteNode` walk gives the two things the URL can't: whether the
 * leaf has a `loader` and its `contextKey` (the cache key derives from `getContextKey`, not the URL).
 */
export function resolveFocusedLoaderRoute(
  state: ReactNavigationState,
  routeNode: RouteNode
): ActiveLoaderRoute | null {
  // `+not-found`/`_sitemap` sit beside the `__root` slot and carry no loader.
  const outer = focusedRoute(state);
  if (!outer || outer.name === NOT_FOUND_ROUTE_NAME || outer.name === SITEMAP_ROUTE_NAME) {
    return null;
  }
  if (outer.name !== INTERNAL_SLOT_NAME) {
    return null;
  }

  // Match each focused nav-state `route.name` to a child `RouteNode.route` — both are the same
  // (possibly multi-segment) string.
  let navState: any = outer.state;
  let nodes: RouteNode[] | undefined = routeNode.children;
  let node: RouteNode | null = null;

  while (navState) {
    const route = focusedRoute(navState);
    if (!route) {
      return null;
    }

    const name = route.name.startsWith('/') ? route.name.slice(1) : route.name;
    node = nodes?.find((child) => child.route === name) ?? null;
    if (!node) {
      return null;
    }

    nodes = node.children;
    navState = route.state;
  }

  if (!node) {
    return null;
  }

  // A loaderless route would 404 — nothing to warm.
  if (!node.loadRoute().loader) {
    return null;
  }

  const routeInfo = getRouteInfoFromState(state);
  const contextKey = getContextKey(node.contextKey);

  return {
    resolvedPath: resolveLoaderKey(contextKey, routeInfo.params, routeInfo.searchParams),
    contextKey,
    params: routeInfo.params,
    searchParams: routeInfo.searchParams,
    loadRoute: node.loadRoute,
  };
}
