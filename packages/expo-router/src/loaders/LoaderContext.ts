import { createContext } from 'react';

import { activeLoaderRuntimes, LoaderRuntime } from './LoaderRuntime';
import { bumpDevLoaderRevision } from './utils';

export const defaultLoaderRuntime = new LoaderRuntime();
export const LoaderContext = createContext(defaultLoaderRuntime);

if (__DEV__ && typeof window !== 'undefined') {
  globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];
  if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(() => {
      delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
      bumpDevLoaderRevision();
      for (const runtime of activeLoaderRuntimes) runtime.invalidate();
    });
  }
}
