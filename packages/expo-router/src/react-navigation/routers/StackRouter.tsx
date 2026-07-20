import { nanoid } from 'nanoid/non-secure';

import { BaseRouter } from './BaseRouter';
import { createParamsFromAction } from './createParamsFromAction';
import { createRouteFromAction } from './createRouteFromAction';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
  Route,
  Router,
} from './types';

export type StackActionType =
  | {
      type: 'REPLACE';
      payload: { name: string; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'PUSH';
      payload: { name: string; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP';
      payload: { count: number };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP_TO_TOP';
      source?: string;
      target?: string;
    }
  | {
      type: 'POP_TO';
      payload: {
        name: string;
        params?: object;
        merge?: boolean;
      };
      source?: string;
      target?: string;
    }
  | {
      type: 'REMOVE_ROUTES';
      payload: { routeNames: string[] };
    };

export type StackRouterOptions = DefaultRouterOptions;

export type StackNavigationState<ParamList extends ParamListBase> = NavigationState<ParamList> & {
  /**
   * Type of the router, in this case, it's stack.
   */
  type: 'stack';
};

export function getStackRoutes<ParamList extends ParamListBase>(
  state: StackNavigationState<ParamList>
) {
  return {
    activeRoutes: state.routes.slice(0, state.index + 1),
    preloadedRoutes: state.routes.slice(state.index + 1),
  };
}

function getStateWithRoutes<ParamList extends ParamListBase>(
  state: StackNavigationState<ParamList>,
  activeRoutes: Route<string>[],
  preloadedRoutes = getStackRoutes(state).preloadedRoutes
) {
  const activeKeys = new Set(activeRoutes.map((route) => route.key));

  return {
    ...state,
    index: activeRoutes.length - 1,
    routes: activeRoutes.concat(preloadedRoutes.filter((route) => !activeKeys.has(route.key))),
  };
}

export type StackActionHelpers<ParamList extends ParamListBase> = {
  /**
   * Replace the current route with a new one.
   *
   * @param screen Name of the new route that will replace the current one.
   * @param [params] Params object for the new route.
   */
  replace<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;

  /**
   * Push a new screen onto the stack.
   *
   * @param screen Name of the route to push onto the stack.
   * @param [params] Params object for the route.
   */
  push<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;

  /**
   * Pop a screen from the stack.
   */
  pop(count?: number): void;

  /**
   * Pop to the first route in the stack, dismissing all other screens.
   */
  popToTop(): void;

  /**
   * Pop any screens to go back to the specified screen.
   * If the specified screen doesn't exist, it'll be added to the stack.
   *
   * @param screen Name of the route to pop to.
   * @param [params] Params object for the route.
   * @param [options.merge] Whether to merge the params onto the route. Defaults to `false`.
   */
  popTo<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName], options?: { merge?: boolean }]
        : [screen: RouteName, params: ParamList[RouteName], options?: { merge?: boolean }]
      : never
  ): void;
};

export const StackActions = {
  replace(name: string, params?: object) {
    return {
      type: 'REPLACE',
      payload: { name, params },
    } as const satisfies StackActionType;
  },
  push(name: string, params?: object) {
    return {
      type: 'PUSH',
      payload: { name, params },
    } as const satisfies StackActionType;
  },
  pop(count: number = 1) {
    return {
      type: 'POP',
      payload: { count },
    } as const satisfies StackActionType;
  },
  popToTop() {
    return { type: 'POP_TO_TOP' } as const satisfies StackActionType;
  },
  popTo(name: string, params?: object, options?: { merge?: boolean }) {
    if (typeof options === 'boolean') {
      console.warn(
        `Passing a boolean as the third argument to 'popTo' is deprecated. Pass '{ merge: true }' instead.`
      );
    }

    return {
      type: 'POP_TO',
      payload: {
        name,
        params,
        merge: typeof options === 'boolean' ? options : options?.merge,
      },
    } as const satisfies StackActionType;
  },
};

export function getRoutesForRouteNames(
  state: StackNavigationState<ParamListBase>,
  routeNames: string[],
  {
    routeParamList,
    routeKeyChanges = [],
    initialRouteName,
  }: {
    routeParamList: ParamListBase;
    routeKeyChanges?: string[];
    initialRouteName?: string;
  }
): Pick<StackNavigationState<ParamListBase>, 'routes' | 'index'> {
  const { activeRoutes, preloadedRoutes } = getStackRoutes(state);
  const routes = activeRoutes.filter(
    (route) => routeNames.includes(route.name) && !routeKeyChanges.includes(route.name)
  );

  if (routes.length === 0) {
    const fallbackName =
      initialRouteName !== undefined && routeNames.includes(initialRouteName)
        ? initialRouteName
        : routeNames[0]!;

    routes.push({
      key: `${fallbackName}-${nanoid()}`,
      name: fallbackName,
      params: routeParamList[fallbackName],
    });
  }

  const result = getStateWithRoutes(
    state,
    routes,
    preloadedRoutes.filter(
      (route) => routeNames.includes(route.name) && !routeKeyChanges.includes(route.name)
    )
  );

  return { routes: result.routes, index: result.index };
}

/**
 * StackRouter is considered an internal implementation and its behavior may change without a notice between expo-router's version
 */
export function StackRouter(options: StackRouterOptions) {
  const router: Router<
    StackNavigationState<ParamListBase>,
    CommonNavigationAction | StackActionType
  > = {
    ...BaseRouter,

    type: 'stack',

    getInitialState({ routeNames, routeParamList }) {
      const initialRouteName =
        options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName)
          ? options.initialRouteName
          : routeNames[0]!;

      return {
        stale: false,
        type: 'stack',
        key: `stack-${nanoid()}`,
        index: 0,
        routeNames,
        routes: [
          {
            key: `${initialRouteName}-${nanoid()}`,
            name: initialRouteName,
            params: routeParamList[initialRouteName],
          },
        ],
      };
    },

    getRehydratedState(partialState, { routeNames, routeParamList }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const hydrateRoutes = (routes: typeof state.routes) =>
        routes
          .filter((route) => routeNames.includes(route.name))
          .map((route) => ({
            ...route,
            key: route.key || `${route.name}-${nanoid()}`,
            params:
              routeParamList[route.name] !== undefined
                ? {
                    ...routeParamList[route.name],
                    ...route.params,
                  }
                : route.params,
          }));

      const index = state.index ?? state.routes.length - 1;
      const activeRoutes = hydrateRoutes(state.routes.slice(0, index + 1));
      const preloadedRoutes = hydrateRoutes(state.routes.slice(index + 1));
      const routes = activeRoutes;

      if (routes.length === 0) {
        const initialRouteName =
          options.initialRouteName !== undefined ? options.initialRouteName : routeNames[0]!;

        routes.push({
          key: `${initialRouteName}-${nanoid()}`,
          name: initialRouteName,
          params: routeParamList[initialRouteName],
        });
      }

      return {
        stale: false,
        type: 'stack',
        key: `stack-${nanoid()}`,
        index: routes.length - 1,
        routeNames,
        routes: routes.concat(preloadedRoutes),
      };
    },

    getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
      return {
        ...state,
        routeNames,
        ...getRoutesForRouteNames(state, routeNames, {
          routeParamList,
          routeKeyChanges,
          initialRouteName: options.initialRouteName,
        }),
      };
    },

    getStateForRouteFocus(state, key) {
      const { activeRoutes } = getStackRoutes(state);
      const index = activeRoutes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return {
        ...state,
        index,
        routes: activeRoutes.slice(0, index + 1).concat(state.routes.slice(state.index + 1)),
      };
    },

    getStateForAction(state, action, options) {
      const { routeParamList } = options;
      const { activeRoutes, preloadedRoutes } = getStackRoutes(state);

      switch (action.type) {
        case 'REPLACE': {
          const currentIndex =
            action.target === state.key && action.source
              ? activeRoutes.findIndex((r) => r.key === action.source)
              : state.index;

          if (currentIndex === -1) {
            return null;
          }

          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          let route = preloadedRoutes.find(
            (route) =>
              route.name === action.payload.name && id === getId?.({ params: route.params })
          );

          if (!route) {
            route = createRouteFromAction({ action, routeParamList });
          } else {
            route = {
              ...route,
              params: createParamsFromAction({ action, routeParamList }),
            };
          }

          return getStateWithRoutes(
            state,
            activeRoutes.map((r, i) => (i === currentIndex ? route : r)),
            preloadedRoutes.filter((r) => r.key !== route.key)
          );
        }

        case 'PUSH':
        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = activeRoutes.findLast(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          } else if (action.type === 'NAVIGATE') {
            const currentRoute = activeRoutes[state.index]!;

            // If the route matches the current one, then navigate to it
            if (action.payload.name === currentRoute.name) {
              route = currentRoute;
            } else if (action.payload.pop) {
              route = activeRoutes.findLast((route) => route.name === action.payload.name);
            }
          }

          if (!route) {
            route = preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          let params;

          if (action.type === 'NAVIGATE' && action.payload.merge && route) {
            params =
              action.payload.params !== undefined ||
              routeParamList[action.payload.name] !== undefined
                ? {
                    ...routeParamList[action.payload.name],
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params = createParamsFromAction({ action, routeParamList });
          }

          let routes: Route<string>[];

          if (route) {
            if (action.type === 'NAVIGATE' && action.payload.pop) {
              routes = [];

              // Get all routes until the matching one
              for (const r of activeRoutes) {
                if (r.key === route.key) {
                  routes.push({
                    ...route,
                    path: action.payload.path !== undefined ? action.payload.path : route.path,
                    params,
                  });
                  break;
                }

                routes.push(r);
              }

              if (!routes.some((r) => r.key === route.key)) {
                routes.push({
                  ...route,
                  path: action.payload.path !== undefined ? action.payload.path : route.path,
                  params,
                });
              }
            } else {
              routes = activeRoutes.filter((r) => r.key !== route.key);
              routes.push({
                ...route,
                path:
                  action.type === 'NAVIGATE' && action.payload.path !== undefined
                    ? action.payload.path
                    : route.path,
                params,
              });
            }
          } else {
            routes = [
              ...activeRoutes,
              {
                key: `${action.payload.name}-${nanoid()}`,
                name: action.payload.name,
                path: action.type === 'NAVIGATE' ? action.payload.path : undefined,
                params,
              },
            ];
          }

          return getStateWithRoutes(
            state,
            routes,
            preloadedRoutes.filter((route) => routes[routes.length - 1]!.key !== route.key)
          );
        }

        case 'NAVIGATE_DEPRECATED': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          if (
            preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            )
          ) {
            return null;
          }

          // If the route already exists, navigate to that
          let index = -1;

          if (id !== undefined) {
            index = activeRoutes.findIndex(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          } else if (activeRoutes[state.index]!.name === action.payload.name) {
            index = state.index;
          } else {
            index = activeRoutes.findLastIndex((route) => route.name === action.payload.name);
          }

          if (index === -1) {
            const routes = [...activeRoutes, createRouteFromAction({ action, routeParamList })];
            return getStateWithRoutes(state, routes);
          }

          const route = activeRoutes[index]!;

          let params;

          if (action.payload.merge) {
            params =
              action.payload.params !== undefined || routeParamList[route.name] !== undefined
                ? {
                    ...routeParamList[route.name],
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params = createParamsFromAction({ action, routeParamList });
          }

          return getStateWithRoutes(state, [
            ...activeRoutes.slice(0, index),
            params !== route.params ? { ...route, params } : activeRoutes[index]!,
          ]);
        }

        case 'REMOVE_ROUTES': {
          const focusedRoute = activeRoutes[state.index]!;
          const routes = activeRoutes.filter(
            (route) =>
              route.key === focusedRoute.key || !action.payload.routeNames.includes(route.name)
          );

          if (routes.length === activeRoutes.length) {
            return state;
          }

          return getStateWithRoutes(state, routes);
        }

        case 'POP': {
          const currentIndex =
            action.target === state.key && action.source
              ? activeRoutes.findIndex((r) => r.key === action.source)
              : state.index;

          if (currentIndex > 0) {
            const count = Math.max(currentIndex - action.payload.count + 1, 1);
            const routes = activeRoutes
              .slice(0, count)
              .concat(activeRoutes.slice(currentIndex + 1));

            return getStateWithRoutes(state, routes);
          }

          return null;
        }

        case 'POP_TO_TOP':
          return router.getStateForAction(
            state,
            {
              type: 'POP',
              payload: { count: state.index },
            },
            options
          );

        case 'POP_TO': {
          const currentIndex =
            action.target === state.key && action.source
              ? activeRoutes.findLastIndex((r) => r.key === action.source)
              : state.index;

          if (currentIndex === -1) {
            return null;
          }

          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          // If the route already exists, navigate to it
          let index = -1;

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          if (id !== undefined) {
            for (let i = currentIndex; i >= 0; i--) {
              const route = activeRoutes[i]!;
              if (route.name === action.payload.name && id === getId?.({ params: route.params })) {
                index = i;
                break;
              }
            }
          } else if (activeRoutes[currentIndex]!.name === action.payload.name) {
            index = currentIndex;
          } else {
            for (let i = currentIndex; i >= 0; i--) {
              if (activeRoutes[i]!.name === action.payload.name) {
                index = i;
                break;
              }
            }
          }

          // If the route doesn't exist, remove the current route and add the new one
          if (index === -1) {
            // Re-use preloaded route if available
            let route = preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );

            if (!route) {
              route = createRouteFromAction({ action, routeParamList });
            } else {
              route = {
                ...route,
                params: createParamsFromAction({ action, routeParamList }),
              };
            }

            const routes = activeRoutes.slice(0, currentIndex).concat(route);
            return getStateWithRoutes(
              state,
              routes,
              preloadedRoutes.filter((r) => r.key !== route.key)
            );
          }

          const route = activeRoutes[index]!;

          let params;

          if (action.payload.merge) {
            params =
              action.payload.params !== undefined || routeParamList[route.name] !== undefined
                ? {
                    ...routeParamList[route.name],
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params = createParamsFromAction({ action, routeParamList });
          }

          return getStateWithRoutes(state, [
            ...activeRoutes.slice(0, index),
            params !== route.params ? { ...route, params } : activeRoutes[index]!,
          ]);
        }

        case 'GO_BACK':
          if (state.index > 0) {
            return router.getStateForAction(
              state,
              {
                type: 'POP',
                payload: { count: 1 },
                target: action.target,
                source: action.source,
              },
              options
            );
          }

          return null;

        case 'PRELOAD': {
          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = activeRoutes.findLast(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          if (route) {
            return {
              ...state,
              routes: state.routes.map((r) => {
                if (r.key !== route?.key) {
                  return r;
                }
                return {
                  ...r,
                  params: createParamsFromAction({ action, routeParamList }),
                };
              }),
            };
          } else {
            return getStateWithRoutes(
              state,
              activeRoutes,
              preloadedRoutes
                .filter(
                  (r) => r.name !== action.payload.name || id !== getId?.({ params: r.params })
                )
                .concat(createRouteFromAction({ action, routeParamList }))
            );
          }
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    actionCreators: StackActions,
  };

  return router;
}
