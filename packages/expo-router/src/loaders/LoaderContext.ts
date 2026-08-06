import { createContext } from 'react';

import { routeInfoSubscribe } from '../global-state/routeInfoCache';
import { store as routerStore } from '../global-state/store';
import { LoaderClient } from './LoaderClient';
import { sweepLoaderRoutes } from './LoaderNavigation';
import { LoaderSuspenseStore } from './LoaderSuspenseStore';
import { bumpDevLoaderRevision } from './utils';

export interface LoaderContextValue {
  client: LoaderClient;
  store: LoaderSuspenseStore;
}

export function createLoaderContextValue(client: LoaderClient): LoaderContextValue {
  return { client, store: new LoaderSuspenseStore() };
}

export const defaultLoaderContextValue = createLoaderContextValue(new LoaderClient());
export const LoaderContext = createContext<LoaderContextValue>(defaultLoaderContextValue);

if (typeof window !== 'undefined') {
  routeInfoSubscribe(() => {
    sweepLoaderRoutes(defaultLoaderContextValue, routerStore.state);
  });
}

// On `loader-invalidate`, drop any unconsumed server-injected data, bump the dev revision so
// refetches bypass the platform cache, and refresh live readers in place.
if (__DEV__ && typeof window !== 'undefined') {
  globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];

  if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(() => {
      delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
      bumpDevLoaderRevision();

      const { client, store } = defaultLoaderContextValue;
      store.retain(client.revalidate());
      client.notify();
    });
  }
}
