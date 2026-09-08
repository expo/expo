'use client';

import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react';

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

type RouterRegistrySetters = {
  register: (stateKey: string, entry: RouterRegistryEntry) => boolean;
  unregister: (stateKey: string, entry: RouterRegistryEntry) => boolean;
};

// One Map for the life of the provider, mutated in place. A new context value here during the
// hydration commit makes React drop every streamed Suspense boundary that is still pending.
export const RouterRegistryContext = createContext<RouterRegistry | undefined>(undefined);
const RouterRegistrySettersContext = createContext<RouterRegistrySetters | undefined>(undefined);

export function RouterRegistryProvider({ children }: PropsWithChildren) {
  const [registry] = useState(() => new Map<string, RouterRegistryEntry>());
  const setters = useMemo<RouterRegistrySetters>(
    () => ({
      register(stateKey, entry) {
        if (registry.get(stateKey) === entry) {
          return false;
        }
        registry.set(stateKey, entry);
        return true;
      },
      unregister(stateKey, entry) {
        if (registry.get(stateKey) !== entry) {
          return false;
        }
        registry.delete(stateKey);
        return true;
      },
    }),
    [registry]
  );

  return (
    <RouterRegistrySettersContext.Provider value={setters}>
      <RouterRegistryContext.Provider value={registry}>{children}</RouterRegistryContext.Provider>
    </RouterRegistrySettersContext.Provider>
  );
}

/**
 * Registers a navigator's router from a layout effect. `onChange` is the only signal consumers get,
 * because the map identity never changes; pass a stable callback.
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
