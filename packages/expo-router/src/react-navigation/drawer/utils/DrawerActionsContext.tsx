'use client';
import * as React from 'react';

/**
 * Imperative controls for the drawer. The drawer's open/closed status lives in the drawer
 * navigator's local React state, so these are provided via context rather than navigation actions.
 */
export type DrawerActions = {
  /**
   * Open the drawer sidebar.
   */
  openDrawer: () => void;
  /**
   * Close the drawer sidebar.
   */
  closeDrawer: () => void;
  /**
   * Open the drawer sidebar if closed, or close it if open.
   */
  toggleDrawer: () => void;
};

export const DrawerActionsContext = React.createContext<DrawerActions | undefined>(undefined);
