'use client';
import { createContext, use } from 'react';

import type { SyncStateStore } from '../react-navigation/core/useSyncState';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import type { RouterStore } from './store';

export const StoreContext = createContext<RouterStore | null>(null);

export const useExpoRouterStore = () => use(StoreContext)!;

export type NavigationReducer = (
  state: NavigationState,
  action: NavigationAction
) => NavigationState | PartialState<NavigationState> | null;

export type NavigatorRegistryEntry = {
  reduce: NavigationReducer;
  shouldPreventRemove?: (
    currentState: NavigationState,
    nextState: NavigationState,
    action: NavigationAction
  ) => boolean;
  onUnhandledAction?: (action: NavigationAction) => void;
  // Last NAVIGATE/RESET target this navigator couldn't handle (its routes weren't yet valid), held
  // for `UNSTABLE_routeNamesChangeBehavior: 'lastUnhandled'` to restore once the route names change
  // to include those routes. Lives on the registry entry rather than in builder component state, so
  // the store/registry stays the single home for per-navigator navigation data.
  unhandledState?: NavigationState | PartialState<NavigationState>;
};

export type ReducerRegistry = {
  addEntry: (key: string, entry: NavigatorRegistryEntry) => void;
  removeEntry: (key: string, entry: NavigatorRegistryEntry) => void;
  getEntry: (key: string) => NavigatorRegistryEntry | undefined;
  hasReducer: (key: string) => boolean;
  getSnapshot: () => readonly (readonly [string, NavigatorRegistryEntry])[];
};

export function createReducerRegistry(): ReducerRegistry {
  const entries = new Map<string, NavigatorRegistryEntry>();

  return {
    addEntry(key, entry) {
      entries.set(key, entry);
    },
    removeEntry(key, entry) {
      if (entries.get(key) === entry) {
        entries.delete(key);
      }
    },
    getEntry(key) {
      return entries.get(key);
    },
    hasReducer(key) {
      return entries.has(key);
    },
    getSnapshot() {
      return Array.from(entries.entries());
    },
  };
}

export const ReducerRegistryContext = createContext<ReducerRegistry | null>(null);

export const NavigationSyncStateContext = createContext<SyncStateStore<
  NavigationState | PartialState<NavigationState> | undefined
> | null>(null);
