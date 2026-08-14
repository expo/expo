'use client';
import * as React from 'react';
import { use } from 'react';

import {
  findFocusedRoute,
  getPathFromState,
  getStateFromPath,
  NavigationHelpersContext,
  NavigationRouteContext,
  useStateForPath,
} from '../core';
import type { NavigationState, PartialState } from '../routers';
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
    [options?.config, route?.key, navigation, focusedRouteState, getPathFromStateHelper]
  );

  return buildHref;
}

/**
 * Helper to build a navigation action from a href based on the linking options.
 */
export const useBuildAction = () => {
  const { options } = use(LinkingContext);

  const getStateFromPathHelper = options?.getStateFromPath ?? getStateFromPath;

  const buildAction = React.useCallback(
    (href: string) => {
      if (!href.startsWith('/')) {
        throw new Error(`The href must start with '/' (${href}).`);
      }

      const state = getStateFromPathHelper(href, options?.config);

      if (state) {
        const route = state.routes[state.index ?? state.routes.length - 1];
        if (!route) {
          throw new Error('Failed to parse the href to a navigation state.');
        }

        return {
          type: 'NAVIGATE' as const,
          payload: {
            name: route.name,
            ...(route.params !== undefined ? { params: route.params } : undefined),
            ...(route.path !== undefined ? { path: route.path } : undefined),
            ...(route.state !== undefined ? { state: markState(route.state) } : undefined),
            ...(route.state !== undefined || hasNestedScreens(options?.config, route.name)
              ? { pop: true }
              : undefined),
          },
        };
      } else {
        throw new Error('Failed to parse the href to a navigation state.');
      }
    },
    [options?.config, getStateFromPathHelper]
  );

  return buildAction;
};

function markState(state: NavigationState | PartialState<NavigationState>): (
  | NavigationState
  | PartialState<NavigationState>
) & {
  __internal__routerActionState: true;
} {
  return { ...state, __internal__routerActionState: true };
}

function hasNestedScreens(
  config: { screens?: Record<string, string | { screens?: object } | undefined> } | undefined,
  routeName: string
) {
  const routeConfig = config?.screens?.[routeName];
  return (
    typeof routeConfig === 'object' &&
    routeConfig.screens !== undefined &&
    Object.keys(routeConfig.screens).length > 0
  );
}

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
