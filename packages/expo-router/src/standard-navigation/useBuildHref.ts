import { useMemo } from 'react';

import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import {
  useStateForPath,
  type NavigationRoute,
  type ParamListBase,
} from '../react-navigation/core';
import type { FocusedRouteState } from '../react-navigation/core/NavigationFocusedRouteStateContext';

// TODO(@ubax): move route info to state - https://linear.app/expo/issue/ENG-21483/refactor-state-to-include-all-route-info-information
export function useBuildHref() {
  const currentState = useStateForPath();
  return useMemo(() => {
    const cache = new WeakMap<NavigationRoute<ParamListBase, string>, string>();
    return (route: NavigationRoute<ParamListBase, string>) => {
      const cached = cache.get(route);
      if (cached !== undefined) {
        return cached;
      }
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
      const href = getRouteInfoFromState(addState(currentState)).pathnameWithParams;
      cache.set(route, href);
      return href;
    };
  }, [currentState]);
}
