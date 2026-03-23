import * as React from 'react';

export type FocusedRouteState = {
  routes: [
    {
      key?: string;
      name: string;
      params?: object;
      path?: string;
      state?: FocusedRouteState;
    },
  ];
};

/**
 * Context for the parent route of a navigator.
 */
export const NavigationFocusedRouteStateContext = React.createContext<
  FocusedRouteState | undefined
>(undefined);
