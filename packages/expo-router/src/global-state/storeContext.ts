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

export type ReducerRegistry = {
  addReducer: (key: string, reducer: NavigationReducer) => void;
  removeReducer: (key: string, reducer: NavigationReducer) => void;
  getReducer: (key: string) => NavigationReducer | undefined;
  hasReducer: (key: string) => boolean;
  getSnapshot: () => readonly (readonly [string, NavigationReducer])[];
};

export function createReducerRegistry(): ReducerRegistry {
  const reducers = new Map<string, NavigationReducer>();

  return {
    addReducer(key, reducer) {
      reducers.set(key, reducer);
    },
    removeReducer(key, reducer) {
      if (reducers.get(key) === reducer) {
        reducers.delete(key);
      }
    },
    getReducer(key) {
      return reducers.get(key);
    },
    hasReducer(key) {
      return reducers.has(key);
    },
    getSnapshot() {
      return Array.from(reducers.entries());
    },
  };
}

export const ReducerRegistryContext = createContext<ReducerRegistry | null>(null);
