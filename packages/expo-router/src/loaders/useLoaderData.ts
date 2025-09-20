import { use } from 'react';

import { ServerDataLoaderContext } from './ServerDataLoaderContext';
import { useRouteNode } from '../Route';
import { useLocalSearchParams } from '../hooks';
import { resolveHref } from '../link/href';
import { LoaderFunction } from '../types';

const loaderDataCache = new Map<string, any>();
const loaderPromiseCache = new Map<string, Promise<any>>();

export function useLoaderData<T = any>(loader: LoaderFunction<T>): T {
  const routeNode = useRouteNode();
  const params = useLocalSearchParams();
  const serverDataLoaderContext = use(ServerDataLoaderContext);

  if (!routeNode) {
    throw new Error('No route node found. This is likely a bug in expo-router.');
  }

  const resolvedPath = `/${resolveHref({ pathname: routeNode?.route, params })}`;

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

  // Check cache for route data
  if (loaderDataCache.has(resolvedPath)) {
    return loaderDataCache.get(resolvedPath);
  }

  // Fetch data if not cached
  if (!loaderPromiseCache.has(resolvedPath)) {
    const promise = fetchLoaderModule(resolvedPath)
      .then((data) => {
        loaderDataCache.set(resolvedPath, data);
        return data;
      })
      .catch((error) => {
        console.error(`Failed to load loader data for route: ${resolvedPath}:`, error);
        throw new Error(`Failed to load loader data for route: ${resolvedPath}`, {
          cause: error,
        });
      })
      .finally(() => {
        loaderPromiseCache.delete(resolvedPath);
      });

    loaderPromiseCache.set(resolvedPath, promise);
  }

  return use(loaderPromiseCache.get(resolvedPath)!);
}

/**
 * Fetches and parses a loader module from the given route path.
 * This works in all environments including:
 * 1. Development with Metro dev server (see `LoaderModuleMiddleware`)
 * 2. Production with static files (SSG)
 * 3. SSR environments
 */
export async function fetchLoaderModule(routePath: string): Promise<any> {
  const loaderPath = `/_expo/loaders${routePath}.js`;

  // NOTE(@hassankhan): Might be a good idea to convert `loaderPath` to an `URL` object
  const response = await fetch(loaderPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch loader data: ${response.status}`);
  }

  const text = await response.text();
  // Modules are generated as: export default {json}
  const match = text.match(/export default (.+)$/m);
  if (match) {
    return JSON.parse(match[1]);
  }

  throw new Error('Invalid loader module format');
}
