'use client';
import { createContext } from 'react';

import type { NavigationState } from '../react-navigation/routers';
import type { createNavigationActionResultRegistry } from './navigationActionResult';

export const NavigationActionResultRegistryContext = createContext<
  ReturnType<typeof createNavigationActionResultRegistry> | undefined
>(undefined);

/** Explicit capabilities, never inferred from a router's type string. */
export function createNativeBackRegistry() {
  const owners = new Map<string, Set<object>>();
  const listeners = new Set<() => void>();
  let version = 0;
  const publish = () => {
    version++;
    for (const listener of listeners) listener();
  };
  return {
    register(key: string) {
      const token = {};
      const registrations = owners.get(key) ?? new Set<object>();
      registrations.add(token);
      owners.set(key, registrations);
      publish();
      return {
        remove() {
          if (!registrations.delete(token)) return;
          if (registrations.size === 0) owners.delete(key);
          publish();
        },
      };
    },
    ownsFocusedChain(state: NavigationState, prevented: ReadonlySet<string>) {
      let focused: NavigationState | undefined = state;
      while (focused) {
        if (!owners.has(focused.key)) return false;
        const route: NavigationState['routes'][number] | undefined = focused.routes[focused.index];
        if (!route || prevented.has(route.key)) return false;
        if (route.state && route.state.stale !== false) return false;
        focused = route.state?.stale === false ? route.state : undefined;
      }
      return true;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getVersion: () => version,
  };
}

export const NativeBackRegistryContext = createContext<
  ReturnType<typeof createNativeBackRegistry> | undefined
>(undefined);
