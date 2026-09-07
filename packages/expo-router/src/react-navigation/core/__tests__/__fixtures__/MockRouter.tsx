import {
  BaseRouter,
  type CommonNavigationAction,
  type DefaultRouterOptions,
  type NavigationState,
  type Router,
} from '../../../routers';

export type MockActions = CommonNavigationAction | { type: 'NOOP' | 'UPDATE' };

export const MockRouterKey = { current: 0 };

export function MockRouter(_options: DefaultRouterOptions) {
  const router: Router<NavigationState, MockActions> = {
    type: 'test',

    getStateForRouteFocus(state, key) {
      const index = state.routes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return { ...state, index };
    },

    getStateForAction(state, action) {
      switch (action.type) {
        case 'UPDATE':
          return {
            state: { ...state, type: 'test' },
            affectedRouteKey: state.routes[state.index]?.key,
          };

        case 'NOOP':
          return {
            state: { ...state, type: 'test' },
            affectedRouteKey: state.routes[state.index]?.key,
          };

        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          let index = state.routes.findIndex((route) => route.name === action.payload.name);

          let routes;

          if (index === -1) {
            routes = [
              ...state.routes,
              {
                name: action.payload.name,
                key: `${action.payload.name}-${MockRouterKey.current++}`,
                params: action.payload.params,
              },
            ];
            index = routes.length - 1;
          } else {
            routes =
              action.payload.params !== undefined
                ? state.routes.map((route, i) =>
                    i === index
                      ? {
                          ...route,
                          params: {
                            ...route.params,
                            ...action.payload.params,
                          },
                        }
                      : route
                  )
                : state.routes;
          }

          return {
            state: {
              ...state,
              type: 'test',
              index,
              routes,
            },
            affectedRouteKey: routes[index]!.key,
          };
        }

        case 'GO_BACK': {
          if (state.index === 0) {
            return null;
          }

          return {
            state: {
              ...state,
              type: 'test',
              index: state.index - 1,
            },
            affectedRouteKey: state.routes[state.index - 1]!.key,
          };
        }

        default: {
          const result = BaseRouter.getStateForAction(state, action);
          return result === null
            ? null
            : { ...result, state: { ...result.state, type: 'test' } };
        }
      }
    },

    shouldActionChangeFocus(action: CommonNavigationAction) {
      return action.type === 'NAVIGATE';
    },
  };

  return router;
}
