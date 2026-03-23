import type { NavigationState, ParamListBase } from '@react-navigation/routers';
import * as React from 'react';

import { isRecordEqual } from './isRecordEqual';
import type { RouteProp } from './types';

type RouteCache = Map<string, RouteProp<ParamListBase>>;

/**
 * Utilities such as `getFocusedRouteNameFromRoute` need to access state.
 * So we need a way to suppress the warning for those use cases.
 * This is fine since they are internal utilities and this is not public API.
 */
export const CHILD_STATE = Symbol('CHILD_STATE');

/**
 * Hook to cache route props for each screen in the navigator.
 * This lets add warnings and modifications to the route object but keep references between renders.
 */
export function useRouteCache<State extends NavigationState>(
  routes: State['routes']
) {
  // Cache object which holds route objects for each screen
  const cache = React.useMemo(() => ({ current: new Map() as RouteCache }), []);

  cache.current = routes.reduce((acc, route) => {
    const previous = cache.current.get(route.key);
    const { state, ...routeWithoutState } = route;

    let proxy;

    if (previous && isRecordEqual(previous, routeWithoutState)) {
      // If a cached route object already exists, reuse it
      proxy = previous;
    } else {
      proxy = routeWithoutState;
    }

    if (process.env.NODE_ENV !== 'production') {
      // FIXME: since the state is updated with mutation, the route object cannot be frozen
      // As a workaround, loop through the object and make the properties readonly
      for (const key in proxy) {
        // @ts-expect-error: this is fine since we are looping through the object
        const value = proxy[key];

        Object.defineProperty(proxy, key, {
          enumerable: true,
          configurable: true,
          writable: false,
          value,
        });
      }
    }

    Object.defineProperty(proxy, CHILD_STATE, {
      enumerable: false,
      configurable: true,
      value: state,
    });

    acc.set(route.key, proxy);

    return acc;
  }, new Map() as RouteCache);

  return Array.from(cache.current.values());
}
