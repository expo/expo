'use client';

import { createContext, use, useEffect } from 'react';

import { useRouteNode } from '../Route';
import {
  getNavigateAction,
  type NavigateActionConfig,
  type NavigationResolution,
} from '../global-state/getNavigationAction';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { findStateByKey } from '../global-state/stateUtils';
import { resolveHref } from '../link/href';
import { getContextKey } from '../matchers';
import { NavigationBuilderContext } from '../react-navigation/core/NavigationBuilderContext';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import type { NavigationAction, NavigationState } from '../react-navigation/native';
import { shouldLinkExternally } from '../utils/url';
import { GuardContext, getResolvedGuard, type GuardFallback } from './GuardContext';

// Id of the stack navigator that removes its own blocked routes and resolves their internal `redirectTo`.
export const GuardedRoutesCleanupContext = createContext<string | undefined>(undefined);

/**
 * Lets a stack navigator remove its guarded routes from history, including the focused route.
 * Returns the navigator id for `GuardedRoutesCleanupContext`.
 */
export function useClearGuardedRoutes() {
  // The full state of this navigator, with its key and preloaded routes.
  const state = use(NavigatorStateContext);
  const guards = use(GuardContext);
  const node = useRouteNode();
  const navigatorId = node ? getContextKey(node.contextKey) : undefined;
  const { handleIntent } = use(NavigationBuilderContext);

  useEffect(() => {
    if (!state || !guards?.size) {
      return;
    }
    if (!state.routes.some((route) => getResolvedGuard(guards, route.name))) {
      return;
    }
    // Both jobs read the newest state, so a repeated run, like in Strict Mode, changes nothing.
    // They skip the routing queue, so navigation started in the same handler runs after them.
    handleIntent({
      type: 'COMPUTED_ACTION',
      payload: { compute: (rootState, config) => getRedirectAction(rootState, config, state.key) },
    });
    handleIntent({
      type: 'COMPUTED_ACTION',
      payload: {
        compute: (rootState, config) =>
          getRemoveRoutesAction(rootState, config, state.key, navigatorId),
      },
    });
  }, [guards, handleIntent, navigatorId, state]);

  return navigatorId;
}

// Replaces the focused blocked route with its internal `redirectTo` when the stack is on screen.
function getRedirectAction(
  rootState: NavigationState,
  config: NavigateActionConfig,
  stackKey: string
): NavigationAction | Extract<NavigationResolution, { status: 'redirect-loop' }> | undefined {
  const stack = findStateByKey(rootState, stackKey);
  const route = stack?.routes[stack.index];
  const redirectTo = route
    ? config.registry.get(stackKey)?.getGuard?.(route.name)?.redirectTo
    : undefined;
  if (redirectTo === undefined) {
    return undefined;
  }
  const href = resolveHref(redirectTo);
  // The blocked screen opens an external URL with `Redirect`, because a reducer cannot open URLs.
  if (shouldLinkExternally(href) || !isOnFocusedPath(rootState, stackKey)) {
    return undefined;
  }

  const resolution = getNavigateAction(
    href,
    {},
    config,
    'REPLACE',
    undefined,
    undefined,
    undefined,
    rootState,
    { chain: [], from: getRouteInfoFromState(cutFocusedPathAt(rootState, stackKey)) }
  );
  if (resolution.status === 'action') {
    return resolution.action;
  }
  if (resolution.status === 'redirect-loop') {
    return resolution;
  }
  if (resolution.status === 'invalid') {
    // TODO(@ubax): move console side effects out of the reducer.
    console.warn(
      `Could not generate a valid navigation state for the given path: ${resolution.href}`
    );
  }
  // The removal job removes a blocked route that has no accessible destination.
  return undefined;
}

function getRemoveRoutesAction(
  rootState: NavigationState,
  config: NavigateActionConfig,
  stackKey: string,
  navigatorId: string | undefined
): NavigationAction | undefined {
  const stack = findStateByKey(rootState, stackKey);
  const getGuard = config.registry.get(stackKey)?.getGuard;
  if (!stack || !getGuard) {
    return undefined;
  }
  // The focused screen stays, so its `Redirect` can open an external `redirectTo`.
  const focusedRoute = stack.routes[stack.index];
  const focusedRedirectTo = focusedRoute ? getGuard(focusedRoute.name)?.redirectTo : undefined;
  const keptRouteKey =
    focusedRedirectTo !== undefined &&
    shouldLinkExternally(resolveHref(focusedRedirectTo)) &&
    isOnFocusedPath(rootState, stackKey)
      ? focusedRoute?.key
      : undefined;
  const routeNames = new Set<string>();
  let fallback: GuardFallback | undefined;
  // Preloaded routes after `index` are included.
  for (const route of stack.routes) {
    const guard = getGuard(route.name);
    if (guard) {
      routeNames.add(route.name);
      fallback ??= guard.fallback;
    }
  }
  if (!routeNames.size) {
    return undefined;
  }

  // A fallback in a parent navigator is opened by the remaining route.
  const ownFallback =
    fallback && fallback.navigatorId === navigatorId
      ? { name: fallback.name, params: fallback.params }
      : undefined;
  return {
    type: 'REMOVE_ROUTES',
    payload: { routeNames: Array.from(routeNames), fallback: ownFallback, keptRouteKey },
    target: stack.key,
  };
}

function isOnFocusedPath(rootState: NavigationState, stateKey: string): boolean {
  let state: NavigationState | undefined = rootState;
  while (state) {
    if (state.key === stateKey) {
      return true;
    }
    const focusedState: NavigationState['routes'][number]['state'] =
      state.routes[state.index]?.state;
    state = focusedState?.stale === false ? focusedState : undefined;
  }
  return false;
}

// Drops the nested state of the focused route in `stateKey`, so a relative `redirectTo`
// resolves against the blocked route and keeps the params of its parent routes.
function cutFocusedPathAt(state: NavigationState, stateKey: string): NavigationState {
  return {
    ...state,
    routes: state.routes.map((route, index) => {
      if (index !== state.index) {
        return route;
      }
      if (state.key === stateKey) {
        const { state: _nested, ...blockedRoute } = route;
        return blockedRoute;
      }
      // `isOnFocusedPath` checked that every state on this path is a full navigation state.
      return { ...route, state: cutFocusedPathAt(route.state as NavigationState, stateKey) };
    }),
  };
}
