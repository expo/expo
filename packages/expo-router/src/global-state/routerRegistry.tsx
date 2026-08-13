'use client';

import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react';

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
  routerType: string | undefined;
  contextKey?: string;
};

// Entries appear after the first commit and state keys can change when navigation state is reset.
export type RouterRegistry = ReadonlyMap<string, RouterRegistryEntry>;

type RouterRegistrySetters = {
  register: (stateKey: string, entry: RouterRegistryEntry) => void;
  unregister: (stateKey: string, entry: RouterRegistryEntry) => void;
};

// React components read this map during render, so React state is intentional.
export const RouterRegistryContext = createContext<RouterRegistry | undefined>(undefined);
const RouterRegistrySettersContext = createContext<RouterRegistrySetters | undefined>(undefined);

export function RouterRegistryProvider({ children }: PropsWithChildren) {
  const [registry, setRegistry] = useState<RouterRegistry>(() => new Map());
  const setters = useMemo<RouterRegistrySetters>(
    () => ({
      register(stateKey, entry) {
        setRegistry((previous) => {
          if (previous.get(stateKey) === entry) {
            return previous;
          }

          return new Map(previous).set(stateKey, entry);
        });
      },
      unregister(stateKey, entry) {
        setRegistry((previous) => {
          if (previous.get(stateKey) !== entry) {
            return previous;
          }

          const next = new Map(previous);
          next.delete(stateKey);
          return next;
        });
      },
    }),
    []
  );

  return (
    <RouterRegistrySettersContext.Provider value={setters}>
      <RouterRegistryContext.Provider value={registry}>{children}</RouterRegistryContext.Provider>
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
