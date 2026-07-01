'use client';
import * as React from 'react';

/**
 * A tab navigator's `routes` are ordered by its back stack, not declaration order.
 * The tab bar / drawer items / screens render in declaration order, so this returns the
 * routes ordered to match `orderNames`. Names with no matching route are dropped.
 */
export function useStableTabOrder<Route extends { name: string }>(
  orderNames: readonly string[],
  routes: readonly Route[]
): Route[] {
  return React.useMemo(
    () =>
      orderNames
        .map((name) => routes.find((route) => route.name === name))
        .filter(Boolean) as Route[],
    [orderNames, routes]
  );
}
