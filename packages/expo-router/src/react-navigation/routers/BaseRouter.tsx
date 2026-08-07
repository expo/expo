import { nanoid } from 'nanoid/non-secure';

import type {
  CommonNavigationAction,
  KeyedPartialState,
  NavigationState,
  NavigatorParamsPayload,
  PartialState,
  RouterConfigOptions,
} from './types';

/**
 * Base router object that can be used when writing custom routers.
 * This provides few helper methods to handle common actions such as `RESET`.
 */
export const BaseRouter = {
  getStateForDeclaredRoutes<
    State extends NavigationState,
    InputState extends State | KeyedPartialState<State>,
  >(state: InputState, routeNames: string[], fallbackRouteKey?: string): InputState {
    const declaredRouteNames = new Set(routeNames);
    const routes = state.routes.filter((route) => declaredRouteNames.has(route.name));

    if (
      routes.length === state.routes.length &&
      state.index !== undefined &&
      !(routes.length === 0 && fallbackRouteKey && routeNames[0])
    ) {
      return state;
    }

    if (routes.length === 0 && fallbackRouteKey && routeNames[0]) {
      routes.push({ key: fallbackRouteKey, name: routeNames[0] });
    }

    const focusedKey = state.routes[state.index ?? 0]?.key;
    const index = Math.max(
      0,
      routes.findIndex((route) => route.key === focusedKey)
    );

    // Filtering preserves keyed routes and their recursively keyed nested states.
    return { ...state, routes, index } as InputState;
  },

  getStateForNavigatorParams<State extends NavigationState>(
    state: State | KeyedPartialState<State>,
    params: NavigatorParamsPayload,
    _options: RouterConfigOptions
  ): State | KeyedPartialState<State> | null {
    if (params.state) {
      return { ...params.state, key: state.key } as KeyedPartialState<State>;
    }

    return null;
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

  shouldActionChangeFocus(action: CommonNavigationAction) {
    return action.type === 'NAVIGATE' || action.type === 'NAVIGATE_DEPRECATED';
  },
};
