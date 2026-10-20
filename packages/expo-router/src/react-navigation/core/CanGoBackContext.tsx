'use client';

import { createContext } from 'react';

import type { NavigationState, PartialState } from '../routers';

export const CanGoBackContext = createContext<boolean | undefined>(undefined);

// A navigator without `history` falls back to its index.
export function hasBackTarget(state: NavigationState | PartialState<NavigationState>) {
  return state.history != null ? state.history.length > 1 : (state.index ?? 0) > 0;
}
