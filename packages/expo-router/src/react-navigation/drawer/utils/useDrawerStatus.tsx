'use client';
import { use } from 'react';

import type { DrawerStatus } from '../../native';
import { DrawerStatusContext } from './DrawerStatusContext';

/**
 * Hook to detect the drawer's status in a parent navigator.
 * Returns 'open' if the drawer is open, 'closed' if the drawer is closed.
 */
export function useDrawerStatus(): DrawerStatus {
  const drawerStatus = use(DrawerStatusContext);

  if (drawerStatus === undefined) {
    throw new Error("Couldn't find a drawer. Is your component inside a drawer navigator?");
  }

  return drawerStatus;
}
