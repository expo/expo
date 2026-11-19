'use client';

import { use, useEffect, useEffectEvent } from 'react';

import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import { GuardContext, normalizeRouteName } from './GuardContext';

/**
 * Lets a stack navigator clear its own guarded routes from history, based on the guard context.
 */
export function useClearGuardedRoutes(removeRoutesFromState: (routeKeys: string[]) => void) {
  const guards = use(GuardContext);
  // The full state of this navigator, with its preloaded routes.
  const state = use(NavigatorStateContext);
  const removeRoutes = useEffectEvent((routeNames: string[]) => {
    const focusedRouteKey = state?.routes[state.index]?.key;
    // The focused route stays, so its screen can redirect.
    removeRoutesFromState(
      (state?.routes ?? [])
        .filter((route) => route.key !== focusedRouteKey && routeNames.includes(route.name))
        .map((route) => route.key)
    );
  });

  useEffect(() => {
    if (!guards?.size) {
      return;
    }

    const routeNames = Array.from(guards.keys()).flatMap((name) => {
      const normalizedName = normalizeRouteName(name);
      return [normalizedName, `${normalizedName}/index`];
    });

    removeRoutes(routeNames);
  }, [guards]);
}
