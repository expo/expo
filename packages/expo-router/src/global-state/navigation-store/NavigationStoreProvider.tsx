'use client';
import { createContext, useReducer, useRef, type ReactNode } from 'react';

import { navReducer } from './navReducer';
import { createNavigationStore, type NavigationStore } from './navigationStore';
import type { NavigationTree } from './types';

/**
 * The committed navigation tree, flowed down by plain React context (no `useSyncExternalStore`).
 * Consumers read it with `use(RootTreeContext)`; route info / per-navigator slices derive from it.
 */
export const RootTreeContext = createContext<NavigationTree | null>(null);

/**
 * The producer-side staging buffer. Navigators read the live (read-your-writes) tree and stage
 * commits through it; the provider flushes those into {@link RootTreeContext}.
 */
export const NavigationStoreContext = createContext<NavigationStore | null>(null);

export interface NavigationStoreProviderProps {
  initialState: NavigationTree;
  children: ReactNode;
}

/**
 * Owns the single root `useReducer` that holds the whole nested navigation state, and the
 * {@link NavigationStore} staging buffer that bridges react-navigation's synchronous cascade to it.
 */
export function NavigationStoreProvider({ initialState, children }: NavigationStoreProviderProps) {
  // One store per provider instance; created lazily so we don't allocate on every render.
  const storeRef = useRef<NavigationStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createNavigationStore(initialState);
  }
  const store = storeRef.current;

  // Seed from the store's live tree (not the prop) so any pre-mount staged work is reflected in the
  // initial committed state — keeping the reducer state and `store.getState()` in agreement.
  const [tree, dispatch] = useReducer(navReducer, store, (s) => s.getState());

  // Safe to wire during render: `dispatch` from `useReducer` is referentially stable, so this is
  // idempotent under StrictMode double-render and a discarded concurrent render can only re-wire the
  // same function. Only ever pass the reducer's own dispatch here — never a render-derived value.
  // Done in render (not an effect) so imperative navigation can dispatch from the first commit.
  store.setDispatch(dispatch);

  return (
    <NavigationStoreContext.Provider value={store}>
      <RootTreeContext.Provider value={tree}>{children}</RootTreeContext.Provider>
    </NavigationStoreContext.Provider>
  );
}
