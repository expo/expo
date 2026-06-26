'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useMemo, useSyncExternalStore } from 'react';

import { useContextKey } from '../Route';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { LoaderCacheContext } from '../loaders/LoaderCache';
import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';
import { getLoaderData } from '../loaders/getLoaderData';
import { resolveLoaderKey } from '../loaders/resolveLoaderKey';
import { fetchLoader } from '../loaders/utils';
import { useStateForPath } from '../react-navigation/native';

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
 *   return Promise.resolve({ foo: 'bar' }};
 * }
 *
 * export default function Route() {
 *  const data = useLoaderData<typeof loader>(); // { foo: 'bar' }
 *
 *  return <Text>Data: {JSON.stringify(data)}</Text>;
 * }
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
    return resolveLoaderKey(contextKey, routeInfo.params, routeInfo.searchParams);
  }, [contextKey, stateForPath]);

  // First invocation of this hook will happen server-side, so we look up the loaded data from context
  if (serverDataLoaderContext) {
    return serverDataLoaderContext[resolvedPath];
  }

  // The second invocation happens after the client has hydrated on initial load, so we look up the data injected
  // by `<PreloadedDataScript />` using `globalThis.__EXPO_ROUTER_LOADER_DATA__`
  if (typeof window !== 'undefined' && globalThis.__EXPO_ROUTER_LOADER_DATA__?.[resolvedPath]) {
    return globalThis.__EXPO_ROUTER_LOADER_DATA__[resolvedPath];
  }

  // Usually a cache read — `loaderBootstrap` warms this on navigation commit. Falls back to fetching
  // for routes reached without a warm (deep link, direct load, an unfocused sibling).
  const result = getLoaderData<LoaderFunctionResult<T>>({
    resolvedPath,
    cache: loaderCache,
    fetcher: fetchLoader,
  });

  if (result instanceof Promise) {
    return use(result);
  }

  return result;
}
