import type { DrawerStatus } from '@react-navigation/native';
import * as React from 'react';

import { DrawerStatusContext } from './DrawerStatusContext';

/**
 * Hook to detect if the drawer's status in a parent navigator.
 * Returns 'open' if the drawer is open, 'closed' if the drawer is closed.
 */
export function useDrawerStatus(): DrawerStatus {
  const drawerStatus = React.useContext(DrawerStatusContext);

  if (drawerStatus === undefined) {
    throw new Error(
      "Couldn't find a drawer. Is your component inside a drawer navigator?"
    );
  }

  return drawerStatus;
}
