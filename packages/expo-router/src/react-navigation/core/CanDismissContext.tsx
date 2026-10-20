'use client';

import { createContext } from 'react';

import type { RouterRegistry } from '../../global-state/routerRegistry';
import type { NavigationState, PartialState } from '../routers';

export const CanDismissContext = createContext<boolean | undefined>(undefined);
// A stable reader of the committed value, so imperative callers do not re-render when it changes.
export const ReadCanDismissContext = createContext<() => boolean>(() => false);

// Seeded states have no `type` until an action stamps it, so this uses the registered router type.
export function getCanDismiss(rootState: NavigationState, registry: RouterRegistry) {
  let state: NavigationState | PartialState<NavigationState> | undefined = rootState;
  while (state) {
    const index: number = state.index ?? 0;
    if (index > 0 && state.key !== undefined && registry.get(state.key)?.type === 'stack') {
      return true;
    }
    state = state.routes[index]?.state;
  }
  return false;
}
