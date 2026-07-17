import {
  BaseRouter,
  type CommonNavigationAction,
  type DefaultRouterOptions,
  type InternalRouter,
  asFocusChildAction,
  asReconcileRouteNamesAction,
  isUnhandledStateRestore,
  type NavigationState,
  type PartialState,
  type Route,
  type RouterConfigOptions,
} from '../../../routers';

export type MockActions = CommonNavigationAction | { type: 'NOOP' | 'UPDATE' };

export const MockRouterKey = { current: 0 };

// The state a `MockRouter` navigator used to self-seed via `getInitialState` (now removed with the
// self-seed). Tests seed the container with this so a bare `<BaseNavigationContainer>` mounts with a
// committed slice, matching production where the compiler/PRELOAD wire always supplies one.
export function mockInitialState({
  routeNames,
  routeParamList = {},
  initialRouteName,
}: {
  routeNames: string[];
  routeParamList?: Record<string, object | undefined>;
  initialRouteName?: string;
}): NavigationState {
  const index = initialRouteName === undefined ? 0 : routeNames.indexOf(initialRouteName);

  return {
    stale: false,
    key: String(MockRouterKey.current++),
    index,
    routeNames,
    routes: routeNames.map((name) => ({
      name,
      key: name,
      params: routeParamList[name],
    })),
  };
}

export function MockRouter(options: DefaultRouterOptions) {
  function getRehydratedState(
    partialState: PartialState<NavigationState> | NavigationState,
    { routeNames, routeParamList }: RouterConfigOptions
  ): NavigationState {
    const state = partialState;

    if (state.stale === false) {
      return state;
    }

    const routes = state.routes
      .filter((route) => routeNames.includes(route.name))
      .map(
        (route) =>
          ({
            ...route,
            key: route.key || `${route.name}-${MockRouterKey.current++}`,
            params:
              routeParamList[route.name] !== undefined
                ? {
                    ...routeParamList[route.name],
                    ...route.params,
                  }
                : route.params,
          }) as Route<string>
      );

    if (routes.length === 0) {
      routes.push({
        name: routeNames[0]!,
        key: `${routeNames[0]}-${MockRouterKey.current++}`,
        params: routeParamList[routeNames[0]!],
      });
    }

    const previousIndex = state.index;
    const index = Math.min(
      Math.max(
        previousIndex != null
          ? routes.findIndex((route) => route.name === state.routes[previousIndex]?.name)
          : 0,
        0
      ),
      routes.length - 1
    );

    return {
      stale: false,
      key: String(MockRouterKey.current++),
      index,
      routeNames,
      routes,
    };
  }

  function getStateForRouteNamesChange(
    state: NavigationState,
    { routeNames }: RouterConfigOptions & { routeKeyChanges: string[] }
  ): NavigationState {
    const routes = state.routes.filter((route) => routeNames.includes(route.name));

    if (routes.length === 0) {
      routes.push({
        name: routeNames[0]!,
        key: `${routeNames[0]}-${MockRouterKey.current++}`,
      });
    }

    return {
      ...state,
      routeNames,
      routes,
      index: Math.min(state.index, routes.length - 1),
    };
  }

  function getStateForRouteFocus(state: NavigationState, key: string): NavigationState {
    const index = state.routes.findIndex((r) => r.key === key);

    if (index === -1 || index === state.index) {
      return state;
    }

    return { ...state, index };
  }

  const router: InternalRouter<NavigationState, MockActions> = {
    getStateForAction(state, action, options) {
      const reconcile = asReconcileRouteNamesAction(action);
      if (reconcile) {
        if (reconcile.target !== state.key) {
          return null;
        }

        const config = reconcile.payload;
        return isUnhandledStateRestore(state, config.routeNames, config.unhandledState)
          ? getRehydratedState(config.unhandledState, config)
          : getStateForRouteNamesChange(state, config);
      }

      const focusChildAction = asFocusChildAction(action);
      if (focusChildAction) {
        return getStateForRouteFocus(state, focusChildAction.payload.key);
      }

      const { routeParamList } = options;

      switch (action.type) {
        case 'UPDATE':
          return { ...state };

        case 'NOOP':
          return state;

        case 'NAVIGATE':
        case 'NAVIGATE_DEPRECATED': {
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
                params:
                  action.payload.params !== undefined
                    ? {
                        ...routeParamList[action.payload.name],
                        ...action.payload.params,
                      }
                    : routeParamList[action.payload.name],
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
            ...state,
            index,
            routes,
          };
        }

        case 'GO_BACK': {
          if (state.index === 0) {
            return null;
          }

          return {
            ...state,
            index: state.index - 1,
          };
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },
  };

  return router;
}
