'use client';
import * as React from 'react';

import type { NavigationState, ParamListBase } from '../routers';
import { isRecordEqual } from './isRecordEqual';
import type { RouteProp } from './types';

type RouteCache = Map<string, RouteProp<ParamListBase>>;

const EMPTY_PARAMS = {};

// Same as `isRecordEqual`, but compares `params` by value, because navigating with the same
// param values creates a new `params` object. Keep the two functions aligned.
function isRouteEqual(a: RouteProp<ParamListBase>, b: RouteProp<ParamListBase>) {
  if (a === b) {
    return true;
  }

  // `Object.keys` returns `string[]`, but every key comes from a route object.
  const aKeys = Object.keys(a) as (keyof typeof a)[];
  const bKeys = Object.keys(b);

  // A route without `params` equals a route with empty `params`, so leave `params` out of the count.
  const aKeysWithoutParamsCount = aKeys.length - Number('params' in a);
  const bKeysWithoutParamsCount = bKeys.length - Number('params' in b);

  if (aKeysWithoutParamsCount !== bKeysWithoutParamsCount) {
    return false;
  }

  return (
    aKeys.every((key) => key === 'params' || Object.is(a[key], b[key])) &&
    // `params` is typed as `object`, but it is always a plain record of param values.
    isRecordEqual(
      (a.params ?? EMPTY_PARAMS) as Record<string, unknown>,
      (b.params ?? EMPTY_PARAMS) as Record<string, unknown>
    )
  );
}

/**
 * Utilities such as `getFocusedRouteNameFromRoute` need to access state.
 * So we need a way to suppress the warning for those use cases.
 * This is fine since they are internal utilities and this is not public API.
 */
export const CHILD_STATE = Symbol('CHILD_STATE');

/**
 * Hook to cache route props for each screen in the navigator.
 * This lets us add warnings and modifications to the route object but keep references between renders.
 */
export function useRouteCache<State extends NavigationState>(routes: State['routes']) {
  // Cache object which holds route objects for each screen
  const cache = React.useMemo(() => ({ current: new Map() as RouteCache }), []);
  const previousRoutes = cache.current;

  cache.current = routes.reduce((acc, route) => {
    const previous = previousRoutes.get(route.key);
    const { state, ...routeWithoutState } = route;

    let proxy;

    if (previous && isRouteEqual(previous, routeWithoutState)) {
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

  // A navigator can render a route before the state has it. Keep one object for that route, so
  // the screen does not render again when the state adds it.
  const getMissingRoute = (route: RouteProp<ParamListBase>) => {
    const previous = previousRoutes.get(route.key);
    const cached = previous && isRouteEqual(previous, route) ? previous : route;
    cache.current.set(route.key, cached);
    return cached;
  };

  return { cachedRoutes: Array.from(cache.current.values()), getMissingRoute };
}
