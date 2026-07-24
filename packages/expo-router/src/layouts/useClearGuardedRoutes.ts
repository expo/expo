'use client';

import { use, useEffect, useEffectEvent } from 'react';

import { GuardContext } from './GuardContext';

/**
 * Lets a stack navigator clear its own guarded routes from history, based on the guard context.
 */
export function useClearGuardedRoutes(removeRoutesFromState: (routeNames: string[]) => void) {
  const guards = use(GuardContext);
  const removeRoutes = useEffectEvent(removeRoutesFromState);

  useEffect(() => {
    if (!guards?.size) {
      return;
    }

    const routeNames = Array.from(guards.keys()).flatMap((name) => {
      const normalizedName = name.replace(/\/index$/, '');
      return [normalizedName, `${normalizedName}/index`];
    });

    removeRoutes(routeNames);
  }, [guards]);
}
