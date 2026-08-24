import { nanoid } from 'nanoid/non-secure';

import type {
  CommonNavigationAction,
  NavigationAction,
  NavigationState,
  PartialState,
} from './types';

/**
 * Base router object that can be used when writing custom routers.
 * This provides few helper methods to handle common actions such as `RESET`.
 */
export const BaseRouter = {
  getStateForDeclaredRoutes<State extends NavigationState>(
    state: State,
    routeNames: string[]
  ): State {
    const declaredRouteNames = new Set(routeNames);
    const routes = state.routes.filter((route) => declaredRouteNames.has(route.name));

    if (routes.length === state.routes.length) {
      return state;
    }

    const focusedKey = state.routes[state.index]?.key;
    // `-1` reports that nothing is focused; consumers of the focused route handle it.
    const index =
      routes.length === 0
        ? -1
        : Math.max(
            0,
            routes.findIndex((route) => route.key === focusedKey)
          );

    return { ...state, routes, index };
  },

  getStateForAction<State extends NavigationState>(
    state: State,
    action: CommonNavigationAction
  ): State | PartialState<State> | null {
    switch (action.type) {
      case 'SET_PARAMS':
      case 'REPLACE_PARAMS': {
        const index = action.source
          ? state.routes.findIndex((r) => r.key === action.source)
          : state.index;

        if (index === -1) {
          return null;
        }

        return {
          ...state,
          routes: state.routes.map((r, i) =>
            i === index
              ? {
                  ...r,
                  params:
                    action.type === 'REPLACE_PARAMS'
                      ? action.payload.params
                      : { ...r.params, ...action.payload.params },
                }
              : r
          ),
        };
      }

      case 'RESET': {
        const nextState = action.payload as State | PartialState<State>;

        if (
          nextState.routes.length === 0 ||
          nextState.routes.some((route: { name: string }) => !state.routeNames.includes(route.name))
        ) {
          return null;
        }

        if (nextState.stale === false) {
          if (
            state.routeNames.length !== nextState.routeNames.length ||
            nextState.routeNames.some((name) => !state.routeNames.includes(name))
          ) {
            return null;
          }

          return {
            ...nextState,
            routes: nextState.routes.map((route) =>
              route.key ? route : { ...route, key: `${route.name}-${nanoid()}` }
            ),
          };
        }

        return nextState;
      }

      default:
        return null;
    }
  },

  shouldActionChangeFocus(action: NavigationAction) {
    return action.type === 'PUSH' || action.type === 'NAVIGATE';
  },
};
