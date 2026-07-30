'use client';
import * as React from 'react';

import type { NavigationAction, NavigationState } from '../routers';
import { areRouteNamesEqual } from '../routers/areRouteNamesEqual';
import { useClientLayoutEffect } from './useClientLayoutEffect';

type Options<State extends NavigationState> = {
  state: State;
  /** The navigator's declared route names, as returned by `useNavigationBuilder`. */
  routeNames: string[];
  navigation: { dispatch: (action: NavigationAction) => void };
};

/**
 * Reconciles a navigator's state when its declared route names change without a remount (for
 * example on an HMR update that adds or removes a route file). Called by navigator components,
 * not by `useNavigationBuilder`.
 *
 * The durable state change happens through a self-targeted `ROUTE_NAMES_CHANGED` dispatch in a
 * layout effect. For the one interim render before that commits, this returns a display state
 * with the removed routes filtered out (and the index adjusted), so views never see a route
 * without a screen config. Added routes are only created by the router while handling the
 * action — they render one commit later, with their final keys.
 */
export function useStateForRouteNamesChange<State extends NavigationState>({
  state,
  routeNames,
  navigation,
}: Options<State>): State {
  const routeNamesChanged = !areRouteNamesEqual(state.routeNames, routeNames);

  useClientLayoutEffect(() => {
    if (routeNamesChanged) {
      navigation.dispatch({ type: 'ROUTE_NAMES_CHANGED', target: state.key });
    }
  });

  return React.useMemo(() => {
    if (!routeNamesChanged) {
      return state;
    }

    const routes = state.routes.filter((route) => routeNames.includes(route.name));

    // Nothing was removed (only added), or nothing would remain to render. In the latter case
    // the removed routes render through their inert placeholder descriptors (see
    // `useDescriptors`) until the router falls back to the initial route while handling the
    // action.
    if (routes.length === state.routes.length || routes.length === 0) {
      return state;
    }

    const focusedIndex = routes.findIndex((route) => route.key === state.routes[state.index]!.key);

    return {
      ...state,
      routes,
      index: focusedIndex === -1 ? Math.min(state.index, routes.length - 1) : focusedIndex,
    };
  }, [state, routeNames, routeNamesChanged]);
}
