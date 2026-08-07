'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useEffect, useMemo, useSyncExternalStore } from 'react';

import { useContextKey } from '../Route';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { LoaderContext } from '../loaders/LoaderContext';
import { trackLoaderRoute } from '../loaders/LoaderNavigation';
import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';
import { readLoaderData } from '../loaders/readLoaderData';
import { fetchLoader } from '../loaders/utils';
import { useRoute, useStateForPath } from '../react-navigation/native';
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
  const ctx = use(LoaderContext);
  const serverDataLoaderContext = use(ServerDataLoaderContext);

  const { client, store } = ctx;

  // Subscribe before any early returns so a later `loader-invalidate` re-renders this hook even
  // when the initial render was satisfied by `ServerDataLoaderContext` or `__EXPO_ROUTER_LOADER_DATA__`.
  // Returning early before subscribing would also change hook order on the next render once
  // invalidation deletes the injected global.
  useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);

  const stateForPath = useStateForPath();
  const routeKey = useRoute().key;
  const contextKey = useContextKey();

  const resolvedPath = useMemo(() => {
    const routeInfo = getRouteInfoFromState(stateForPath);
    const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
    const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
    const searchString = routeInfo.searchParams?.toString() || '';

    return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
  }, [contextKey, stateForPath]);

  useEffect(() => {
    // Hydration-seeded routes never reach a read miss, so invalidation can't refetch them
    // without a registered fetcher.
    client.registerFetcher(resolvedPath, fetchLoader);
    const unsubscribe = client.subscribeLoader(resolvedPath, (result, isCurrentSource) => {
      if (isCurrentSource) {
        store.set(resolvedPath, result);
      }
    });
    return () => {
      store.dispose(resolvedPath);
      unsubscribe(() => store.teardown(resolvedPath));
    };
  }, [client, resolvedPath, store]);

  // First invocation of this hook will happen server-side, so we look up the loaded data from context
  if (serverDataLoaderContext) {
    return serverDataLoaderContext[resolvedPath];
  }

  trackLoaderRoute(ctx, resolvedPath, routeKey);

  // The second invocation happens after the client has hydrated, so we seed the suspense store
  // with the preloaded data from `globalThis.__EXPO_ROUTER_LOADER_DATA__`
  const hydrationData = globalThis.__EXPO_ROUTER_LOADER_DATA__;
  if (hydrationData && resolvedPath in hydrationData) {
    store.seed(resolvedPath, hydrationData[resolvedPath]);
    delete hydrationData[resolvedPath];
  }

  const result = readLoaderData<LoaderFunctionResult<T>>(ctx, resolvedPath, fetchLoader);
  return result instanceof Promise ? use(result) : result;
}
