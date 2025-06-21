import {
  ParamListBase,
  StackNavigationState,
  type NavigationRoute,
} from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { store, type ReactNavigationState } from '../../global-state/router-store';
import { Href } from '../../types';
import { resolveHref } from '../href';

export function useNextScreenId(): [string | undefined, (href: Href) => void] {
  const [internalNextScreenId, internalSetNextScreenId] = useState<string | undefined>();
  const setNextScreenId = useCallback((href: Href): void => {
    const preloadedRoute = getPreloadedRouteFromRootStateByHref(href);
    const routeKey = preloadedRoute?.key;
    internalSetNextScreenId(routeKey);
  }, []);
  return [internalNextScreenId, setNextScreenId];
}

function getPreloadedRouteFromRootStateByHref(
  href: Href
): NavigationRoute<ParamListBase, string> | undefined {
  const rootState = store.state;
  let hrefState = store.getStateForHref(resolveHref(href));
  let state: ReactNavigationState | undefined = rootState;
  while (hrefState && state) {
    const currentHrefRoute = hrefState.routes[0];
    const currentStateRoute = currentHrefRoute
      ? state.routes.find((r) => r.name === currentHrefRoute.name)
      : undefined;

    if (!currentStateRoute) {
      // Only checking stack, because it is the only native navigator.
      if (state.type === 'stack') {
        const stackState = state as StackNavigationState<ParamListBase>;
        // Sometimes the route is stored inside params
        const innerRoute = currentHrefRoute.state ? currentHrefRoute.state.routes[0] : undefined;
        const preloadedRoute = stackState.preloadedRoutes.find(
          (route) =>
            route.name === currentHrefRoute.name &&
            (!innerRoute ||
              (route.params && 'screen' in route.params && route.params.screen === innerRoute.name))
        );
        return preloadedRoute;
      }
    }
    hrefState = currentHrefRoute?.state;
    state = currentStateRoute?.state;
  }
  return undefined;
}
