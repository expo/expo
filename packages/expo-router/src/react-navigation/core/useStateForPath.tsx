import * as React from 'react';

import { NavigationFocusedRouteStateContext } from './NavigationFocusedRouteStateContext';

/**
 * Hook to get a minimal state representation for the current route.
 * The returned state can be used with `getPathFromState` to build a path.
 *
 * @returns Minimal state to build a path for the current route.
 */
export function useStateForPath() {
  const state = React.useContext(NavigationFocusedRouteStateContext);

  return state;
}
