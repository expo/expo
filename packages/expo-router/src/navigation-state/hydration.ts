// Phase 2 — hydrate the minimal active path from a URL (RFC scenario 1/1b, D1/D8).
//
// URL matching stays static and config-derived (RFC D8), so we reuse `getStateFromPath` (which
// already inserts a navigator's `initialRouteName` anchor — scenario 1b). The greenfield piece is
// the pure converter from react-navigation's nested PartialState into the homogeneous tree.

import { createRouteKey } from './keys';
import type { GlobalNavState, NavNode, RouteEntry } from './types';
import { getStateFromPath, type Options, type ResultState } from '../fork/getStateFromPath';

export function treeFromNavigationState(state: ResultState): GlobalNavState {
  function toNode(partial: ResultState, nodeKey: string): NavNode {
    const routes: RouteEntry[] = partial.routes.map((route) => {
      const key = createRouteKey(route.name);
      const entry: RouteEntry = { key, name: route.name };
      if (route.params) entry.params = route.params;
      // A route's nested navigator is keyed off the (unique) route key, so node keys stay unique.
      if (route.state) entry.child = toNode(route.state, `${key}/nav`);
      return entry;
    });
    const index = routes.length ? (partial.index ?? routes.length - 1) : 0;
    return { key: nodeKey, routes, index };
  }

  return { root: toNode(state, 'root') };
}

/** Build the initial minimal tree for a path, or `undefined` if nothing matches. */
export function hydrate(path: string, options: Options<object>): GlobalNavState | undefined {
  const state = getStateFromPath(path, options);
  return state ? treeFromNavigationState(state) : undefined;
}
