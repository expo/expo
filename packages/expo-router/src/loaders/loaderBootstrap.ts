import { resolveFocusedLoaderRoute } from '../global-state/resolveFocusedLoaderRoute';
import { routeInfoSubscribe } from '../global-state/routeInfoCache';
import { store } from '../global-state/store';
import { defaultLoaderCache, type LoaderCache } from './LoaderCache';
import { getLoaderData } from './getLoaderData';
import { fetchLoader } from './utils';

/**
 * Warm the focused leaf's loader for the just-committed navigation state. Routes through
 * `getLoaderData` so the warm and `useLoaderData` share one promise/data/error map and never
 * double-fetch.
 */
function warmFocusedLoader(cache: LoaderCache) {
  const state = store.state;
  const routeNode = store.routeNode;
  if (!state || !routeNode) {
    return;
  }

  const route = resolveFocusedLoaderRoute(state, routeNode);
  if (!route) {
    return;
  }

  const { resolvedPath } = route;

  // Hydration data is served straight from the global by the read path; no fetch needed.
  if (globalThis.__EXPO_ROUTER_LOADER_DATA__?.[resolvedPath]) {
    return;
  }

  const result = getLoaderData({ resolvedPath, cache, fetcher: fetchLoader });

  // The warm runs before render, so swallow the rejection here; the rejected promise stays cached
  // for `useLoaderData` to surface.
  if (result instanceof Promise) {
    result.catch(() => {});
  }
}

/**
 * Subscribe to navigation commits and warm the focused leaf's loader. Returns the unsubscribe.
 * Mounted once on the client behind `unstable_useServerDataLoaders` (see `ExpoRoot`).
 */
export function subscribeToLoaderWarming(cache: LoaderCache = defaultLoaderCache): () => void {
  return routeInfoSubscribe(() => warmFocusedLoader(cache));
}
