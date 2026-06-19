'use client';
import * as React from 'react';

import type { NavigationState } from '../routers';

/**
 * A tab navigator's `state.routes` is ordered by its back stack, not declaration order.
 * The tab bar / drawer items / screens render in declaration order, so this returns the
 * routes in `routeNames` (declaration) order.
 */
export function useStableTabOrder<State extends NavigationState>(state: State): State['routes'] {
  const { routeNames, routes } = state;

  return React.useMemo(
    () =>
      routeNames
        .map((name) => routes.find((route) => route.name === name))
        .filter(Boolean) as State['routes'],
    [routeNames, routes]
  );
}
