'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useEffect, useMemo, useState } from 'react';

import { useContextKey } from '../Route';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { LoaderContext } from '../loaders/LoaderContext';
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

  const stateForPath = useStateForPath();
  const contextKey = useContextKey();

  const resolvedPath = useMemo(() => {
    const routeInfo = getRouteInfoFromState(stateForPath);
    const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
    const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
    const searchString = routeInfo.searchParams?.toString() || '';

    return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
  }, [contextKey, stateForPath]);

  // Loader data stays in the shared Suspense store; local state only invalidates this reader.
  const [, setVersion] = useState(0);

  // Seed first so hydration is not mistaken for an update missed before subscription.
  if (!serverDataLoaderContext) {
    const hydrationData = globalThis.__EXPO_ROUTER_LOADER_DATA__;
    if (hydrationData && resolvedPath in hydrationData) {
      store.seed(resolvedPath, hydrationData[resolvedPath]);
      delete hydrationData[resolvedPath];
    }
  }

  // Keep this render-scoped rather than in a ref: only the committed render's effect should
  // compare the entry it rendered with the entry present when the subscription attaches.
  const entryAtRender = store.get(resolvedPath);

  useEffect(() => {
    // Seeded routes do not reach a read miss, so register their fetcher explicitly for HMR.
    client.registerFetcher(resolvedPath, fetchLoader);
    const unsubscribe = client.subscribeLoader(
      resolvedPath,
      (result, isCurrentSource) => {
        if (isCurrentSource) {
          store.set(resolvedPath, result);
          setVersion((version) => version + 1);
        }
      },
      { committed: true }
    );
    if (store.get(resolvedPath) !== entryAtRender) {
      setVersion((version) => version + 1);
    }
    return () => {
      store.dispose(resolvedPath);
      unsubscribe(() => store.teardown(resolvedPath));
    };
    // NOTE(@hassankhan): `entryAtRender` is intentionally omitted: including it would recreate
    // the persistent subscription whenever the store entry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, resolvedPath, store]);

  // Server renders read request-injected loader data directly.
  if (serverDataLoaderContext) {
    return serverDataLoaderContext[resolvedPath];
  }

  const result = readLoaderData<LoaderFunctionResult<T>>(ctx, resolvedPath, fetchLoader);
  return result instanceof Promise ? use(result) : result;
}
