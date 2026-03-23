import * as React from 'react';

import type { ParamListBase } from '../routers';
import { NavigationRouteContext } from './NavigationProvider';
import type { RouteProp } from './types';

/**
 * Hook to access the route prop of the parent screen anywhere.
 *
 * @returns Route prop of the parent screen.
 */
export function useRoute<T extends RouteProp<ParamListBase>>(): T {
  const route = React.useContext(NavigationRouteContext);

  if (route === undefined) {
    throw new Error(
      "Couldn't find a route object. Is your component inside a screen in a navigator?"
    );
  }

  return route as T;
}
