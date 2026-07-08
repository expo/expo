'use client';
import { createContext, use } from 'react';

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
  focusRoute?: (
    state: NavigationState,
    routeKey: string
  ) => NavigationState | PartialState<NavigationState>;
  shouldActionChangeFocus?: (action: NavigationAction) => boolean;
  shouldPreventRemove?: (
    currentState: NavigationState,
    nextState: NavigationState,
    action: NavigationAction
  ) => boolean;
  onUnhandledAction?: (action: NavigationAction) => void;
};

export type ReducerRegistry = {
  addEntry: (key: string, entry: NavigatorRegistryEntry) => void;
  removeEntry: (key: string, entry: NavigatorRegistryEntry) => void;
  getEntry: (key: string) => NavigatorRegistryEntry | undefined;
  addReducer: (key: string, reducer: NavigationReducer) => void;
  removeReducer: (key: string, reducer: NavigationReducer) => void;
  getReducer: (key: string) => NavigationReducer | undefined;
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
    addReducer(key, reducer) {
      entries.set(key, { reduce: reducer });
    },
    removeReducer(key, reducer) {
      if (entries.get(key)?.reduce === reducer) {
        entries.delete(key);
      }
    },
    getReducer(key) {
      return entries.get(key)?.reduce;
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
