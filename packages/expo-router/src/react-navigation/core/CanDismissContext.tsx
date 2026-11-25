'use client';

import { createContext } from 'react';

import type { ReactNavigationState } from '../../global-state/types';
import { getHistoryLength } from '../../utils/stack';

export const CanDismissContext = createContext<boolean | undefined>(undefined);

export function getCanDismiss(rootState: ReactNavigationState | undefined) {
  let state = rootState;
  // Keep traversing down the state tree until we find a stack navigator that we can pop
  while (state) {
    // Seeded states have no `type`; anchors are fully supported only in stacks.
    if ((state.type ?? 'stack') === 'stack' && getHistoryLength(state) > 1) {
      return true;
    }
    if (state.index === undefined) return false;

    state = state.routes?.[state.index]?.state;
  }

  return false;
}
