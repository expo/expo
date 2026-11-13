'use client';

import { createContext, use, useEffect } from 'react';

import { useRouteNode } from '../Route';
import {
  getNavigateAction,
  type NavigateActionConfig,
  type NavigationResolution,
} from '../global-state/getNavigationAction';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { useEnqueueRoutingIntent } from '../global-state/routingQueueContext';
import { findStateByKey } from '../global-state/stateUtils';
import { resolveHref } from '../link/href';
import { getContextKey } from '../matchers';
import { IsFocusedContext } from '../react-navigation/core/useIsFocused';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import type { NavigationAction, NavigationState } from '../react-navigation/native';
import { shouldLinkExternally } from '../utils/url';
import {
  GuardContext,
  getResolvedGuard,
  type GuardFallback,
  type ResolvedGuard,
} from './GuardContext';

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
  // A root navigator has no focus context and is always focused.
  const isFocused = use(IsFocusedContext) ?? true;
  const enqueue = useEnqueueRoutingIntent();

  useEffect(() => {
    if (!state || !guards?.size) {
      return;
    }
    const hasGuardedRoute = state.routes
      .slice(0, state.index + 1)
      .some((route) => getResolvedGuard(guards, route.name));
    if (!hasGuardedRoute) {
      return;
    }
    // The action is computed when the queue runs, so navigation queued in the same handler wins.
    enqueue({
      type: 'COMPUTED_ACTION',
      payload: {
        compute: (rootState, config) =>
          getGuardedRoutesAction(rootState, config, state.key, navigatorId),
      },
    });
    // A focused route with `redirectTo` in an unfocused navigator redirects when the navigator is focused again.
  }, [enqueue, guards, isFocused, navigatorId, state]);

  return navigatorId;
}

function getGuardedRoutesAction(
  rootState: NavigationState,
  config: NavigateActionConfig,
  stackKey: string,
  navigatorId: string | undefined
): NavigationAction | Extract<NavigationResolution, { status: 'redirect-loop' }> | undefined {
  const stack = findStateByKey(rootState, stackKey);
  const getGuard = config.registry.get(stackKey)?.getGuard;
  if (!stack || !getGuard) {
    return undefined;
  }

  const focusedRouteName = stack.routes[stack.index]?.name;
  const redirectTo =
    focusedRouteName !== undefined ? getGuard(focusedRouteName)?.redirectTo : undefined;
  if (redirectTo === undefined) {
    return getRemoveRoutesAction(stack, getGuard, navigatorId);
  }
  const href = resolveHref(redirectTo);
  // The blocked screen opens an external URL with `Redirect`, because a reducer cannot open URLs.
  if (shouldLinkExternally(href) || !isOnFocusedPath(rootState, stackKey)) {
    return getRemoveRoutesAction(stack, getGuard, navigatorId, focusedRouteName);
  }

  // The current route is the blocked route, so a relative `redirectTo` resolves against it.
  const resolution = getNavigateAction(
    href,
    {},
    config,
    'REPLACE',
    undefined,
    undefined,
    undefined,
    rootState,
    { chain: [], from: getRouteInfoFromState(rootState) }
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
  // A chain without an accessible destination removes the blocked route like a guard without `redirectTo`.
  return getRemoveRoutesAction(stack, getGuard, navigatorId);
}

function getRemoveRoutesAction(
  stack: NavigationState,
  getGuard: (routeName: string) => ResolvedGuard | undefined,
  navigatorId: string | undefined,
  keptRouteName?: string
): NavigationAction | undefined {
  const routeNames = new Set<string>();
  let fallback: GuardFallback | undefined;
  // Routes after `index` are preloaded. A preloaded route stays until it opens.
  for (const route of stack.routes.slice(0, stack.index + 1)) {
    const guard = getGuard(route.name);
    if (guard && route.name !== keptRouteName) {
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
    payload: { routeNames: Array.from(routeNames), fallback: ownFallback },
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
