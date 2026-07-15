'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useEffect, useMemo, useSyncExternalStore } from 'react';

import { useContextKey } from '../Route';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { LoaderCacheContext } from '../loaders/LoaderCache';
import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';
import { readLoaderData } from '../loaders/readLoaderData';
import { fetchLoader } from '../loaders/utils';
import { useStateForPath } from '../react-navigation/native';
import { getSingularId } from '../useScreens';

type LoaderFunctionResult<T extends LoaderFunction<any>> =
  T extends LoaderFunction<infer R> ? R : unknown;

/**
 * Returns the result of the `loader` function for the calling route.
 *
 * @example
 * ```tsx app/profile/[user].tsx
 * import { Text } from 'react-native';
 * import { useLoaderData } from 'expo-router';
 *
 * export function loader() {
 *   return Promise.resolve({ foo: 'bar' });
 * }
 *
 * export default function Route() {
 *  const data = useLoaderData<typeof loader>(); // { foo: 'bar' }
 *
 *  return <Text>Data: {JSON.stringify(data)}</Text>;
 * }
 * ```
 */
export function useLoaderData<T extends LoaderFunction<any> = any>(): LoaderFunctionResult<T> {
  const serverDataLoaderContext = use(ServerDataLoaderContext);
  const loaderCache = use(LoaderCacheContext);

  // Subscribe before any early returns so a later `loader-invalidate` re-renders this hook even
  // when the initial render was satisfied by `ServerDataLoaderContext` or `__EXPO_ROUTER_LOADER_DATA__`.
  // Returning early before subscribing would also change hook order on the next render once
  // invalidation deletes the injected global.
  useSyncExternalStore(loaderCache.subscribe, loaderCache.getSnapshot, loaderCache.getSnapshot);

  const stateForPath = useStateForPath();
  const contextKey = useContextKey();

  const resolvedPath = useMemo(() => {
    const routeInfo = getRouteInfoFromState(stateForPath);
    const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
    const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
    const searchString = routeInfo.searchParams?.toString() || '';

    return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
  }, [contextKey, stateForPath]);

  useEffect(() => {
    loaderCache.suspense.retain(resolvedPath);
    return () => loaderCache.suspense.release(resolvedPath);
  }, [loaderCache, resolvedPath]);

  // First invocation of this hook will happen server-side, so we look up the loaded data from context
  if (serverDataLoaderContext) {
    return serverDataLoaderContext[resolvedPath];
  }

  // The second invocation happens after the client has hydrated on initial load, so we look up the data injected
  // by `<PreloadedDataScript />` using `globalThis.__EXPO_ROUTER_LOADER_DATA__`
  if (typeof window !== 'undefined' && globalThis.__EXPO_ROUTER_LOADER_DATA__) {
    if (globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath]) {
      return globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath];
    }
  }

  const result = readLoaderData<LoaderFunctionResult<T>>(loaderCache, resolvedPath, fetchLoader);
  return result instanceof Promise ? use(result) : result;
}
