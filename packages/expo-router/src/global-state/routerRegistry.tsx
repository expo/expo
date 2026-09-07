'use client';

import { createContext, use } from 'react';

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

export type RouterRegistrySetters = {
  register: (stateKey: string, entry: RouterRegistryEntry) => void;
  unregister: (stateKey: string, entry: RouterRegistryEntry) => void;
};

export const RouterRegistrySettersContext = createContext<RouterRegistrySetters | undefined>(
  undefined
);

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
