'use client';
import { use } from 'react';

import { type DrawerActions, DrawerActionsContext } from './DrawerActionsContext';

/**
 * Hook to control the drawer (open, close, toggle) from a component inside a drawer navigator.
 */
export function useDrawerActions(): DrawerActions {
  const actions = use(DrawerActionsContext);

  if (actions === undefined) {
    throw new Error("Couldn't find a drawer. Is your component inside a drawer navigator?");
  }

  return actions;
}
