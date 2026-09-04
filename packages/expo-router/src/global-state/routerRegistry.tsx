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

export type RouterRegistryChange = (
  stateKey: string,
  entry: RouterRegistryEntry,
  registered: boolean
) => void;

/**
 * Read handle over the registry. The handle is what goes in context, never the map itself: React
 * drops a streamed `Suspense` boundary that is still pending when any context value above it
 * changes, and navigators register during the hydration commit.
 */
export type RouterRegistryStore = {
  /** The current registry. A new map on every change, so it is safe to hold on to. */
  getSnapshot: () => RouterRegistry;
};

type RouterRegistrySetters = {
  register: (stateKey: string, entry: RouterRegistryEntry) => boolean;
  unregister: (stateKey: string, entry: RouterRegistryEntry) => boolean;
};

export const RouterRegistryContext = createContext<RouterRegistryStore | undefined>(undefined);
const RouterRegistrySettersContext = createContext<RouterRegistrySetters | undefined>(undefined);

function createRouterRegistryStore() {
  let snapshot: RouterRegistry = new Map();

  const store: RouterRegistryStore = { getSnapshot: () => snapshot };

  const setters: RouterRegistrySetters = {
    register(stateKey, entry) {
      if (snapshot.get(stateKey) === entry) {
        return false;
      }

      snapshot = new Map(snapshot).set(stateKey, entry);
      return true;
    },
    unregister(stateKey, entry) {
      if (snapshot.get(stateKey) !== entry) {
        return false;
      }

      const next = new Map(snapshot);
      next.delete(stateKey);
      snapshot = next;
      return true;
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

/**
 * Registers a navigator's router from a layout effect. `onChange` is the only signal consumers get,
 * because both context values are stable; pass a stable callback.
 */
export function useRegisterRouter(
  stateKey: string,
  entry: RouterRegistryEntry,
  onChange?: RouterRegistryChange
): void {
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

    if (setters.register(stateKey, entry)) {
      onChange?.(stateKey, entry, true);
    }
    return () => {
      if (setters.unregister(stateKey, entry)) {
        onChange?.(stateKey, entry, false);
      }
    };
  }, [entry, onChange, setters, stateKey]);
}
