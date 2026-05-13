'use client';

import type { LoaderFunction } from 'expo-server';
import { use, useMemo } from 'react';

import { useContextKey } from '../Route';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { LoaderCacheContext } from '../loaders/LoaderCache';
import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';
import { getLoaderData } from '../loaders/getLoaderData';
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
  const serverDataLoaderContext = use(ServerDataLoaderContext);
  const loaderCache = use(LoaderCacheContext);

  const stateForPath = useStateForPath();
  const contextKey = useContextKey();

  const resolvedPath = useMemo(() => {
    const routeInfo = getRouteInfoFromState(stateForPath);
    const contextPath = contextKey.startsWith('/') ? contextKey.slice(1) : contextKey;
    const resolvedPathname = `/${getSingularId(contextPath, { params: routeInfo.params })}`;
    const searchString = routeInfo.searchParams?.toString() || '';

    return searchString ? `${resolvedPathname}?${searchString}` : resolvedPathname;
  }, [contextKey, stateForPath]);

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
