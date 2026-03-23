import {
  CommonActions,
  findFocusedRoute,
  getActionFromState,
  getPathFromState,
  getStateFromPath,
  NavigationHelpersContext,
  NavigationRouteContext,
  useStateForPath,
} from '@react-navigation/core';
import * as React from 'react';

import { LinkingContext } from './LinkingContext';

type MinimalState = {
  routes: [{ name: string; params?: object; state?: MinimalState }];
};

/**
 * Helper to build a href for a screen based on the linking options.
 */
export function useBuildHref() {
  const navigation = React.useContext(NavigationHelpersContext);
  const route = React.useContext(NavigationRouteContext);

  const { options } = React.useContext(LinkingContext);

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

      const constructState = (
        state: MinimalState | undefined
      ): MinimalState => {
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
 * Helper to build a navigation action from a href based on the linking options.
 */
export const useBuildAction = () => {
  const { options } = React.useContext(LinkingContext);

  const getStateFromPathHelper = options?.getStateFromPath ?? getStateFromPath;
  const getActionFromStateHelper =
    options?.getActionFromState ?? getActionFromState;

  const buildAction = React.useCallback(
    (href: string) => {
      if (!href.startsWith('/')) {
        throw new Error(`The href must start with '/' (${href}).`);
      }

      const state = getStateFromPathHelper(href, options?.config);

      if (state) {
        const action = getActionFromStateHelper(state, options?.config);

        return action ?? CommonActions.reset(state);
      } else {
        throw new Error('Failed to parse the href to a navigation state.');
      }
    },
    [options?.config, getStateFromPathHelper, getActionFromStateHelper]
  );

  return buildAction;
};

/**
 * Helpers to build href or action based on the linking options.
 *
 * @returns `buildHref` to build an `href` for screen and `buildAction` to build an action from an `href`.
 */
export function useLinkBuilder() {
  const buildHref = useBuildHref();
  const buildAction = useBuildAction();

  return {
    buildHref,
    buildAction,
  };
}
