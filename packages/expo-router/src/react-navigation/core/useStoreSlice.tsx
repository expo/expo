'use client';
import * as React from 'react';
import { use } from 'react';

import { NavigationSyncStateContext } from '../../global-state/storeContext';
import type { NavigationState, PartialState } from '../routers';

type State = NavigationState | PartialState<NavigationState> | undefined;

const sliceCache = new WeakMap<object, Map<string, NavigationState | undefined>>();

export function useStoreSlice(key: string | undefined): NavigationState | undefined {
  const store = use(NavigationSyncStateContext);

  if (store == null) {
    throw new Error("Couldn't find a navigation store. Is your component inside a navigator?");
  }

  const getSnapshot = React.useCallback(() => {
    if (key == null) {
      return undefined;
    }

    return getCachedSlice(store.getState(), key);
  }, [key, store]);

  return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function getCachedSlice(
  rootState: State,
  key: string
): NavigationState | undefined {
  if (rootState == null || rootState.stale !== false) {
    return undefined;
  }

  let keyCache = sliceCache.get(rootState);

  if (keyCache == null) {
    keyCache = new Map();
    sliceCache.set(rootState, keyCache);
  }

  if (!keyCache.has(key)) {
    keyCache.set(key, findSlice(rootState, key));
  }

  return keyCache.get(key);
}

function findSlice(state: NavigationState, key: string): NavigationState | undefined {
  if (state.key === key) {
    return state;
  }

  for (const route of state.routes) {
    const childState = route.state;

    if (childState != null && childState.stale === false) {
      const slice = findSlice(childState as NavigationState, key);

      if (slice != null) {
        return slice;
      }
    }
  }

  return undefined;
}
