'use client';

import { createContext, use, useState, type PropsWithChildren } from 'react';

import type { RouteNode } from '../Route';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import type {
  NavigationAction,
  NavigationState,
  RouterActionResult,
} from '../react-navigation/routers';

export type RouterRegistryEntry = {
  reduce: (
    state: NavigationState,
    action: NavigationAction
  ) => RouterActionResult<NavigationState> | null;
  shouldActionChangeFocus?: (action: NavigationAction) => boolean;
  getStateForRouteFocus?: (state: NavigationState, routeKey: string) => NavigationState;
  routeNode?: RouteNode;
};

// Entries appear after the first commit and state keys can change when navigation state is reset.
export type RouterRegistry = ReadonlyMap<string, RouterRegistryEntry>;

/**
 * Read handle over the registry. The handle is the context value, never the map itself: navigators
 * register from layout effects, so a map in context would only become visible one commit later.
 * Readers that need the current entries call `getSnapshot`; readers that need to re-render on a
 * change subscribe.
 */
export type RouterRegistryStore = {
  /** The current registry. A new map on every change, so it is safe to hold on to. */
  getSnapshot: () => RouterRegistry;
  subscribe: (listener: () => void) => () => void;
};

type RouterRegistrySetters = {
  register: (stateKey: string, entry: RouterRegistryEntry) => void;
  unregister: (stateKey: string, entry: RouterRegistryEntry) => void;
};

export const RouterRegistryContext = createContext<RouterRegistryStore | undefined>(undefined);
const RouterRegistrySettersContext = createContext<RouterRegistrySetters | undefined>(undefined);

function createRouterRegistryStore() {
  let snapshot: RouterRegistry = new Map();
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const store: RouterRegistryStore = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  const setters: RouterRegistrySetters = {
    register(stateKey, entry) {
      if (snapshot.get(stateKey) === entry) {
        return;
      }

      snapshot = new Map(snapshot).set(stateKey, entry);
      emit();
    },
    unregister(stateKey, entry) {
      if (snapshot.get(stateKey) !== entry) {
        return;
      }

      const next = new Map(snapshot);
      next.delete(stateKey);
      snapshot = next;
      emit();
    },
  };

  return { store, setters };
}

export function RouterRegistryProvider({ children }: PropsWithChildren) {
  const [{ store, setters }] = useState(createRouterRegistryStore);

  return (
    <RouterRegistrySettersContext.Provider value={setters}>
      <RouterRegistryContext.Provider value={store}>{children}</RouterRegistryContext.Provider>
    </RouterRegistrySettersContext.Provider>
  );
}

export function useRegisterRouter(stateKey: string, entry: RouterRegistryEntry): void {
  const setters = use(RouterRegistrySettersContext);

  useClientLayoutEffect(() => {
    if (setters === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Router registry is unavailable. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
        );
      }
      return;
    }

    setters.register(stateKey, entry);
    return () => setters.unregister(stateKey, entry);
  }, [entry, setters, stateKey]);
}
