// The glue the flag seams call (Decisions R-4/R-13). Keeps changes to the shared files (ExpoRoot,
// routingQueue, useRouteInfo, BackHandler) to a one-line branch each. All resolution is render-free
// (C12): it reads the committed snapshot + the static linking config + the per-navigator routers from
// the registry, computes the next node, and commits it through `dispatchNav`.

import { resolveNavigate } from './actions';
import { resolveBack } from './back';
import { treeFromNavigationState } from './hydration';
import { navigationStateFromTree } from './projection';
import { dispatchNav, getNavSnapshot } from './store';
import type { GlobalNavState } from './types';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { getRouteInfoFromState, type UrlObject } from '../global-state/getRouteInfoFromState';
import type { LinkAction } from '../global-state/routingQueue';
import { store } from '../global-state/store';
import type { NavigationAction } from '../react-navigation/native';

/** `linking` wraps the app under the synthetic `__root` slot (path ''); unwrap to the app navigator.
 * Find the slot by name, not position — `_sitemap`/`+not-found` can be top-level siblings. (Those
 * sibling-as-focused cases aren't fully handled yet; see Decisions R-10.) */
function unwrapSlot(full: GlobalNavState): GlobalNavState {
  const slot = full.root.routes.find((route) => route.name === INTERNAL_SLOT_NAME);
  return slot?.child ? { root: slot.child } : full;
}

/** Hydrate a path into the APP root tree. */
function hydrateAppTree(path: string): GlobalNavState | undefined {
  const rnState = store.linking?.getStateFromPath?.(path, store.linking.config);
  return rnState ? unwrapSlot(treeFromNavigationState(rnState)) : undefined;
}

/** The initial app tree, from the state `useStore` already computed from the initial URL. */
export function getInitialAppTree(): GlobalNavState | undefined {
  return store.state ? unwrapSlot(treeFromNavigationState(store.state as ResultState)) : undefined;
}

/** Run one queued imperative action against the new model (replaces the RN container dispatch). */
export function imperativeDispatch(action: NavigationAction | LinkAction): void {
  const snapshot = getNavSnapshot();
  if (!snapshot) return;

  if (action.type === 'ROUTER_LINK') {
    // KNOWN LIMIT (R-10): `options.event` (PUSH vs NAVIGATE vs REPLACE) is ignored — everything uses
    // navigate semantics, so `router.push` to an already-present route won't add a duplicate yet.
    const target = hydrateAppTree((action as LinkAction).payload.href);
    if (!target) return;
    const next = resolveNavigate(snapshot, target);
    if (next) dispatchNav({ key: snapshot.root.key, next, source: 'js' });
    return;
  }
  if (action.type === 'GO_BACK' || action.type === 'POP' || action.type === 'POP_TO_TOP') {
    const result = resolveBack(snapshot);
    if ('exit' in result) return;
    dispatchNav({ key: result.key, next: result.next, source: 'js' });
  }
}

/** Project a tree into the `UrlObject` the URL hooks read. `getRouteInfoFromState` expects the
 * `__root` slot the app tree was unwrapped from, so re-wrap it. Pass the render-time tree (not the
 * committed-ref snapshot) so URL hooks update in the same render as the navigation. */
export function projectRouteInfo(tree: GlobalNavState | null): UrlObject {
  if (!tree) return getRouteInfoFromState(undefined);
  const wrapped = {
    index: 0,
    routes: [{ name: INTERNAL_SLOT_NAME, state: navigationStateFromTree(tree) }],
  };
  return getRouteInfoFromState(wrapped as never);
}

/** Hardware back (Android): handle via the tree, or return false so the OS exits the app. */
export function handleHardwareBack(): boolean {
  const snapshot = getNavSnapshot();
  if (!snapshot) return false;
  const result = resolveBack(snapshot);
  if ('exit' in result) return false;
  dispatchNav({ key: result.key, next: result.next, source: 'js' });
  return true;
}
