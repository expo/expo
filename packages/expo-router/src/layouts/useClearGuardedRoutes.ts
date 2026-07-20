'use client';

import { use, useEffect } from 'react';

import { GuardContext } from './GuardContext';

/**
 * Lets a stack navigator clear its own guarded routes from history, based on the guard context.
 */
export function useClearGuardedRoutes(removeRoutesFromState: (routeNames: string[]) => void) {
  const guards = use(GuardContext);

  useEffect(() => {
    if (!guards?.size) {
      return;
    }

    const routeNames = Array.from(guards.keys()).flatMap((name) => {
      const normalizedName = name.replace(/\/index$/, '');
      return [normalizedName, `${normalizedName}/index`];
    });

    removeRoutesFromState(routeNames);
  }, [guards, removeRoutesFromState]);
}
