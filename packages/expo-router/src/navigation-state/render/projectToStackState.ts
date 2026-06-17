// R-Phase B — project a NavNode slice into the inert StackNavigationState shape (Decisions R-2). One
// of the inputs the existing stack views need (alongside the per-route `navigation` shim + descriptors
// built separately). It is a one-way render projection — never fed to `useNavigationBuilder` — so it
// does not re-create Option A's reconcile-and-write-back fight. Route KEYS pass through unchanged (the
// single key authority, P-13), which preserves screen identity across navigations. Callers should
// `useMemo` the result on the slice, since each call allocates a fresh object.

import type { ParamListBase } from '../../react-navigation/native';
import type { StackNavigationState } from '../../react-navigation/routers';
import type { NavNode } from '../types';

export function projectToStackState(node: NavNode): StackNavigationState<ParamListBase> {
  const routes = node.routes.map((route) => ({
    key: route.key,
    name: route.name,
    params: route.params,
  }));
  return {
    stale: false,
    type: 'stack',
    key: node.key,
    index: node.index,
    routeNames: routes.map((route) => route.name),
    routes,
    // The new tree has no preload concept (D6); preloaded routes are out of scope under the flag.
    preloadedRoutes: [],
    // Cast bridges `routeNames: string[]` to the type's `keyof ParamList[]`; the object is otherwise
    // structurally complete for what the views read.
  } as StackNavigationState<ParamListBase>;
}
