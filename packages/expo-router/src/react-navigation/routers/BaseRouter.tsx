import { createRouteKeyMinter } from './stateKeys';
import type {
  CommonNavigationAction,
  NavigationAction,
  NavigationState,
  PartialState,
  RouterActionResult,
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
  ): RouterActionResult<State> | null {
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
          state: {
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
          },
          affectedRouteKey: state.routes[index]!.key,
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

          const minter = createRouteKeyMinter({
            key: state.key,
            routeKeySeq: Math.max(state.routeKeySeq, nextState.routeKeySeq ?? 0),
          });
          const result = {
            ...nextState,
            routes: nextState.routes.map((route) =>
              route.key ? route : { ...route, key: minter.mint(route.name) }
            ),
            routeKeySeq: minter.routeKeySeq,
          };

          return {
            state: result,
            affectedRouteKey: result.routes[result.index]?.key,
          };
        }

        // TODO: support completing partial reset payloads at dispatch (follow-up PR).
        // Until then the action is ignored so a partial payload warns instead of
        // crashing the render.
        console.warn(
          'The RESET action payload must contain a complete navigation state. Partial states can no longer be completed during render. Include `key`, `index`, `routeNames`, `routeKeySeq`, and `stale: false` when resetting.'
        );
        return null;
      }

      default:
        return null;
    }
  },

  shouldActionChangeFocus(action: NavigationAction) {
    return action.type === 'PUSH' || action.type === 'NAVIGATE';
  },
};
