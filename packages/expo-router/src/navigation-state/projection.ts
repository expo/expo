// Phase 3b — project the focused path back to a URL string (RFC scenarios 2/3, D1).
//
// Serialization stays config-derived (D8), so we reuse `getPathFromState`; the greenfield piece is
// the inverse of hydration — the homogeneous tree back into react-navigation's nested state (keys
// dropped, they are not part of the URL). `getPathFromState` follows `index` to the focused path.

import type { GlobalNavState, NavNode } from './types';
import { getPathFromState, type Options } from '../fork/getPathFromState';
import type { NavigationState, PartialState } from '../react-navigation/routers';

type PartialNav = Omit<PartialState<NavigationState>, 'stale'>;

function stateFromNode(node: NavNode): PartialNav {
  return {
    index: node.index,
    routes: node.routes.map((route) => ({
      name: route.name,
      ...(route.params ? { params: route.params } : {}),
      ...(route.child ? { state: stateFromNode(route.child) } : {}),
    })),
  };
}

export function navigationStateFromTree(tree: GlobalNavState): PartialNav {
  return stateFromNode(tree.root);
}

/** Serialize the tree's focused path to a URL string. */
export function project(tree: GlobalNavState, options?: Options<object>): string {
  return getPathFromState(navigationStateFromTree(tree), options);
}
