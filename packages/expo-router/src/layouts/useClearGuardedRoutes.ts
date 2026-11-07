'use client';

import { use, useEffect, useEffectEvent } from 'react';
import type { NavigatorState } from 'standard-navigation';

import { GuardContext, normalizeRouteName } from './GuardContext';

/**
 * Lets a stack navigator clear its own guarded routes from history, based on the guard context.
 */
export function useClearGuardedRoutes(
  state: NavigatorState,
  removeRoutesFromState: (routeNames: string[]) => void
) {
  const guards = use(GuardContext);
  const removeRoutes = useEffectEvent((routeNames: string[]) => {
    // The router keeps the focused route so that its redirect can fire.
    const hasRemovableRoute = state.routes.some(
      (route, index) => index !== state.index && routeNames.includes(route.name)
    );

    // The dispatch is queued, so it is reported as unhandled when the navigator unmounts first.
    if (hasRemovableRoute) {
      removeRoutesFromState(routeNames);
    }
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
