'use client';

import { createContext, use, useEffect, useEffectEvent } from 'react';
import type { NavigatorState } from 'standard-navigation';

import { useRouteNode } from '../Route';
import { getContextKey } from '../matchers';
import { GuardContext, getResolvedGuard, type GuardFallback } from './GuardContext';

// Id of the stack navigator that opens its own fallback, so its screens do not replace themselves.
export const GuardedRoutesCleanupContext = createContext<string | undefined>(undefined);

/**
 * Lets a stack navigator remove its guarded routes from history, including the focused route.
 * Returns the navigator id for `GuardedRoutesCleanupContext`.
 */
export function useClearGuardedRoutes(
  state: NavigatorState,
  removeRoutesFromState: (
    routeNames: string[],
    fallback?: { name: string; params?: object }
  ) => void
) {
  const guards = use(GuardContext)?.guards;
  const node = useRouteNode();
  const navigatorId = node ? getContextKey(node.contextKey) : undefined;
  const removeRoutes = useEffectEvent(removeRoutesFromState);

  useEffect(() => {
    if (!guards?.size) {
      return;
    }

    const routeNames = new Set<string>();
    let fallback: GuardFallback | undefined;
    // Routes after `index` are preloaded. A preloaded route stays until it opens.
    for (const route of state.routes.slice(0, state.index + 1)) {
      const guard = getResolvedGuard(guards, route.name);
      if (guard) {
        routeNames.add(route.name);
        fallback ??= guard.fallback;
      }
    }
    // The focused route with `redirectTo` stays, so its redirect can run.
    const focusedRouteName = state.routes[state.index]?.name;
    if (
      focusedRouteName !== undefined &&
      getResolvedGuard(guards, focusedRouteName)?.redirectTo !== undefined
    ) {
      routeNames.delete(focusedRouteName);
    }
    if (!routeNames.size) {
      return;
    }

    // A fallback in a parent navigator is opened by the remaining route.
    const ownFallback =
      fallback && fallback.navigatorId === navigatorId
        ? { name: fallback.name, params: fallback.params }
        : undefined;
    removeRoutes(Array.from(routeNames), ownFallback);
  }, [guards, navigatorId, state]);

  return navigatorId;
}
