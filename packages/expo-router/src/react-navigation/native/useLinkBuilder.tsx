'use client';
import * as React from 'react';
import { use } from 'react';

import {
  findFocusedRoute,
  getPathFromState,
  NavigationHelpersContext,
  NavigationRouteContext,
  useStateForPath,
} from '../core';
import { LinkingContext } from './LinkingContext';

type MinimalState = {
  routes: [{ name: string; params?: object; state?: MinimalState }];
};

/**
 * Helper to build a href for a screen based on the linking options.
 */
export function useBuildHref() {
  const navigation = use(NavigationHelpersContext);
  const route = use(NavigationRouteContext);

  const { options } = use(LinkingContext);

  const focusedRouteState = useStateForPath();

  const getPathFromStateHelper = options?.getPathFromState ?? getPathFromState;

  const buildHref = React.useCallback(
    (name: string, params?: object) => {
      if (options?.enabled === false) {
        return undefined;
      }

      // Check that we're inside:
      // - navigator's context
      // - route context of the navigator (could be a screen, tab, etc.)
      // - route matches the state for path (from the screen's context)
      // This ensures that we're inside a screen
      const isScreen =
        navigation && route?.key && focusedRouteState
          ? route.key === findFocusedRoute(focusedRouteState)?.key &&
            navigation.getState().routes.some((r) => r.key === route.key)
          : false;

      const stateForRoute: MinimalState = {
        routes: [{ name, params }],
      };

      const constructState = (state: MinimalState | undefined): MinimalState => {
        if (state) {
          const route = state.routes[0];

          // If we're inside a screen and at the innermost route
          // We need to replace the state with the provided one
          // This assumes that we're navigating to a sibling route
          if (isScreen && !route.state) {
            return stateForRoute;
          }

          // Otherwise, dive into the nested state of the route
          return {
            routes: [
              {
                ...route,
                state: constructState(route.state),
              },
            ],
          };
        }

        // Once there is no more nested state, we're at the innermost route
        // We can add a state based on provided parameters
        // This assumes that we're navigating to a child of this route
        // In this case, the helper is used in a navigator for its routes
        return stateForRoute;
      };

      const state = constructState(focusedRouteState);
      const path = getPathFromStateHelper(state, options?.config);

      return path;
    },
    [
      options?.enabled,
      options?.config,
      route?.key,
      navigation,
      focusedRouteState,
      getPathFromStateHelper,
    ]
  );

  return buildHref;
}

/**
 * Helpers to build href or action based on the linking options.
 *
 * @returns `buildHref` to build an `href` for a screen.
 */
export function useLinkBuilder() {
  const buildHref = useBuildHref();

  return {
    buildHref,
  };
}
