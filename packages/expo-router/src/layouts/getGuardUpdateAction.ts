import { getNavigateAction, type NavigateActionConfig } from '../global-state/getNavigationAction';
import { ProtectedRedirectLoopError } from '../global-state/protectedAction';
import type { RouterRegistry, RouterRegistryEntry } from '../global-state/routerRegistry';
import { findStateByKey } from '../global-state/stateUtils';
import { resolveHref } from '../link/href';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import { isActionHandled } from '../react-navigation/routers/utils';
import type { Href } from '../types';
import type { GuardRedirectFallback } from './GuardContext';

type Options = {
  root: NavigationState;
  registry: RouterRegistry;
  config: NavigateActionConfig;
  navigatorKey: string;
  entry: RouterRegistryEntry;
  routeNames: string[];
  // The focused route that was blocked when the navigator rendered.
  blockedKey: string | undefined;
  // A redirect that the navigator already showed on its first render.
  redirectAction: NavigationAction | undefined;
  redirectTo: Href | undefined;
  ancestorFallback: GuardRedirectFallback | undefined;
};

/**
 * Returns the root update for a navigator whose eligible routes changed. While the blocked route
 * is still focused, the update also opens its explicit redirect or the ancestor fallback. If other
 * navigation ran first, such as a replace in the same handler, only the route names change.
 */
export function getGuardUpdateAction({
  root,
  registry,
  config,
  navigatorKey,
  entry,
  routeNames,
  blockedKey,
  redirectAction,
  redirectTo,
  ancestorFallback,
}: Options): NavigationAction | undefined {
  const slice = findStateByKey(root, navigatorKey);
  // The navigator can unmount before the queue drains, for example when a parent guard removes it.
  if (registry.get(navigatorKey) !== entry || !slice) {
    return undefined;
  }
  const namesChanged = {
    type: 'ROUTE_NAMES_CHANGED',
    payload: { routeNames },
    target: navigatorKey,
  };
  if (blockedKey === undefined || slice.routes[slice.index]?.key !== blockedKey) {
    return namesChanged;
  }
  if (redirectAction) {
    return { ...redirectAction, target: navigatorKey };
  }
  if (redirectTo !== undefined) {
    return getRedirectAction(redirectTo, root, slice, config, entry) ?? namesChanged;
  }
  if (ancestorFallback) {
    return getFallbackAction(ancestorFallback, root, navigatorKey, registry) ?? namesChanged;
  }
  return namesChanged;
}

// The committed root still focuses the blocked route, so a relative redirect resolves from it.
function getRedirectAction(
  redirectTo: Href,
  root: NavigationState,
  slice: NavigationState,
  config: NavigateActionConfig,
  entry: RouterRegistryEntry
): NavigationAction | undefined {
  const resolution = getNavigateAction(
    resolveHref(redirectTo),
    {},
    config,
    'REPLACE',
    undefined,
    undefined,
    undefined,
    root
  );
  if (resolution.status === 'redirect-loop') {
    throw new ProtectedRedirectLoopError(resolution.href);
  }
  if (resolution.status !== 'action') {
    return undefined;
  }
  // An ancestor replaces the route that holds the blocked visit. In this navigator the blocked
  // visit is removed first, so a push takes its place.
  const push = { ...resolution.action, type: 'PUSH' };
  return resolution.action.target === slice.key && isActionHandled(entry.reduce(slice, push))
    ? push
    : resolution.action;
}

// Opens the fallback in the nearest ancestor navigator that declared it, by route name.
function getFallbackAction(
  fallback: GuardRedirectFallback,
  root: NavigationState,
  navigatorKey: string,
  registry: RouterRegistry
): NavigationAction | undefined {
  let target: NavigationState | undefined;
  for (let state: NavigationState | undefined = root; state && state.key !== navigatorKey; ) {
    if (registry.get(state.key)?.routeNode === fallback.ownerNode) {
      target = state;
    }
    const child: NavigationState | PartialState<NavigationState> | undefined =
      state.routes[state.index]?.state;
    state = child?.stale === false ? child : undefined;
  }
  const entry = target && registry.get(target.key);
  if (!target || !entry || !fallback.name) {
    return undefined;
  }
  const payload = { name: fallback.name, params: fallback.params };
  return [
    { type: 'REPLACE', payload, target: target.key },
    { type: 'NAVIGATE', payload, target: target.key },
  ].find((action) => isActionHandled(entry.reduce(target, action)));
}
