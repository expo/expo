import { useCallback } from 'react';

import { getCachedRouteInfo } from '../global-state/routeInfoCache';
import {
  useStateForPath,
  type NavigationRoute,
  type ParamListBase,
} from '../react-navigation/core';
import type { FocusedRouteState } from '../react-navigation/core/NavigationFocusedRouteStateContext';

// TODO(@ubax): move route info to state - https://linear.app/expo/issue/ENG-21483/refactor-state-to-include-all-route-info-information
export function useBuildHref() {
  const currentState = useStateForPath();
  return useCallback(
    (route: NavigationRoute<ParamListBase, string>) => {
      const state: FocusedRouteState = {
        routes: [
          {
            name: route.name,
            params: route.params,
          },
        ],
      };
      const addState = (parent: FocusedRouteState | undefined): FocusedRouteState => {
        const parentRoute = parent?.routes[0];

        if (parentRoute) {
          return {
            routes: [
              {
                ...parentRoute,
                state: addState(parentRoute.state),
              },
            ],
          };
        }

        return state;
      };
      return getCachedRouteInfo(addState(currentState)).pathnameWithParams;
    },
    [currentState]
  );
}
