import { BaseRouter } from './BaseRouter';
import { createParamsFromAction } from './createParamsFromAction';
import { createRouteFromAction } from './createRouteFromAction';
import {
  assertSubtreeKeyMatchesRoute,
  getNextRouteKeyFromState,
  getRouteKey,
  getStateKey,
} from './getRouteKey';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  InternalRouter,
  NavigationRoute,
  NavigationState,
  ParamListBase,
  PartialState,
  Route,
} from './types';

export type StackActionType =
  | {
      type: 'REPLACE';
      // TODO(Step 5/7): `state` is dormant — the complete subtree for the replacement route's
      // not-yet-mounted child. Emitted by the wire (Step 5), inserted by the root reducer (Step 7).
      payload: {
        name: string;
        params?: object;
        state?: NavigationState | PartialState<NavigationState>;
      };
      source?: string;
      target?: string;
    }
  | {
      type: 'PUSH';
      // TODO(Step 5/7): `state` is dormant — see `REPLACE` above.
      payload: {
        name: string;
        params?: object;
        state?: NavigationState | PartialState<NavigationState>;
      };
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
    };

export type StackRouterOptions = DefaultRouterOptions;

export type StackNavigationState<ParamList extends ParamListBase> = NavigationState<ParamList>;

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

export const getActiveRoutes = (state: StackNavigationState<ParamListBase>): Route<string>[] =>
  state.routes.slice(0, state.index + 1);

export const getInactiveRoutes = (state: StackNavigationState<ParamListBase>): Route<string>[] =>
  state.routes.slice(state.index + 1);

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
  const routes = state.routes.filter(
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

  return {
    routes,
    index: Math.min(state.index, routes.length - 1),
  };
}

/**
 * StackRouter is considered an internal implementation and its behavior may change without a notice between expo-router's version
 */
export function StackRouter(options: StackRouterOptions) {
  const router: InternalRouter<
    StackNavigationState<ParamListBase>,
    CommonNavigationAction | StackActionType
  > = {
    ...BaseRouter,

    getInitialState({ routeNames, parentRouteKey, routeParamList }) {
      const initialRouteName =
        options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName)
          ? options.initialRouteName
          : routeNames[0]!;

      const key = getStateKey(parentRouteKey);

      return {
        stale: false,
        key,
        index: 0,
        routeNames,
        routes: [
          {
            key: getRouteKey({ stateKey: key, name: initialRouteName }),
            name: initialRouteName,
            params: routeParamList[initialRouteName],
          },
        ],
      };
    },

    getRehydratedState(partialState, { routeNames, parentRouteKey, routeParamList }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const key = getStateKey(parentRouteKey);

      const routes = state.routes
        .filter((route) => routeNames.includes(route.name))
        .reduce<Route<string>[]>((built, route) => {
          const routeKey =
            route.key ||
            getNextRouteKeyFromState({ stateKey: key, name: route.name, state: { routes: built } });
          built.push({
            ...route,
            key: routeKey,
            params:
              routeParamList[route.name] !== undefined
                ? {
                    ...routeParamList[route.name],
                    ...route.params,
                  }
                : route.params,
          });
          return built;
        }, []);

      if (routes.length === 0) {
        const initialRouteName =
          options.initialRouteName !== undefined ? options.initialRouteName : routeNames[0]!;

        routes.push({
          key: getRouteKey({ stateKey: key, name: initialRouteName }),
          name: initialRouteName,
          params: routeParamList[initialRouteName],
        });
      }

      return {
        stale: false,
        key,
        index: routes.length - 1,
        routeNames,
        routes,
      };
    },

    getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
      const keep = (route: Route<string>) =>
        routeNames.includes(route.name) && !routeKeyChanges.includes(route.name);

      const activeRoutes = getActiveRoutes(state).filter(keep);
      const inactiveRoutes = getInactiveRoutes(state).filter(keep);

      if (activeRoutes.length === 0) {
        const initialRouteName =
          options.initialRouteName !== undefined && routeNames.includes(options.initialRouteName)
            ? options.initialRouteName
            : routeNames[0]!;

        activeRoutes.push({
          key: getRouteKey({ stateKey: state.key, name: initialRouteName }),
          name: initialRouteName,
          params: routeParamList[initialRouteName],
        });
      }

      return {
        ...state,
        routeNames,
        index: activeRoutes.length - 1,
        routes: [...activeRoutes, ...inactiveRoutes],
      };
    },

    getStateForRouteFocus(state, key) {
      const activeRoutes = getActiveRoutes(state);
      const index = activeRoutes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return {
        ...state,
        index,
        routes: [...activeRoutes.slice(0, index + 1), ...getInactiveRoutes(state)],
      };
    },

    getStateForAction(state, action, options) {
      const { routeParamList } = options;

      switch (action.type) {
        case 'REPLACE': {
          const activeRoutes = getActiveRoutes(state);
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

          // Re-use a preloaded route if available
          let route: NavigationRoute<ParamListBase, string> | undefined = getInactiveRoutes(
            state
          ).find(
            (route) =>
              route.name === action.payload.name && id === getId?.({ params: route.params })
          );

          if (!route) {
            route = createRouteFromAction({ action, routeParamList }, state);

            // TODO(Step 5/7): payload.state is dormant until the wire emits it and the root reducer
            // inserts it at the boundary. Attach it only to this freshly created replacement (a
            // newly-minted key); a promoted preloaded route keeps its own complete subtree.
            if (action.payload.state !== undefined) {
              route = { ...route, state: action.payload.state };
              assertSubtreeKeyMatchesRoute(route.key, action.payload.state);
            }
          }

          return {
            ...state,
            routes: [
              ...activeRoutes.map((r, i) => (i === currentIndex ? route : r)),
              ...getInactiveRoutes(state).filter((r) => r.key !== route.key),
            ],
          };
        }

        case 'PUSH':
        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const activeRoutes = getActiveRoutes(state);
          const inactiveRoutes = getInactiveRoutes(state);

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
            route = inactiveRoutes.find(
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

          let routes: NavigationRoute<ParamListBase, string>[];

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

              // The loop only walks the active routes, but `route` may be a preloaded one from the
              // inactive tail — append it so a pop-navigation to a preloaded screen lands on it.
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
            const newRoute: NavigationRoute<ParamListBase, string> = {
              key: getNextRouteKeyFromState({
                stateKey: state.key,
                name: action.payload.name,
                state,
              }),
              name: action.payload.name,
              path: action.type === 'NAVIGATE' ? action.payload.path : undefined,
              params,
            };

            // TODO(Step 5/7): payload.state is dormant until the wire emits it and the root reducer
            // inserts it at the boundary. Attach it verbatim only to this freshly created route
            // (a newly-minted key) — the child navigator it describes is not yet mounted.
            if (action.payload.state !== undefined) {
              newRoute.state = action.payload.state;
              assertSubtreeKeyMatchesRoute(newRoute.key, action.payload.state);
            }

            routes = [...activeRoutes, newRoute];
          }

          return {
            ...state,
            index: routes.length - 1,
            routes: [
              ...routes,
              // Don't keep the promoted (navigated to) route in the preloaded tail.
              ...inactiveRoutes.filter((route) => routes[routes.length - 1]!.key !== route.key),
            ],
          };
        }

        case 'NAVIGATE_DEPRECATED': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          if (
            getInactiveRoutes(state).find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            )
          ) {
            return null;
          }

          // If the route already exists, navigate to that
          let index = -1;

          const activeRoutes = getActiveRoutes(state);

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
            const routes = [
              ...activeRoutes,
              createRouteFromAction({ action, routeParamList }, state),
            ];
            return {
              ...state,
              index: routes.length - 1,
              routes: [...routes, ...getInactiveRoutes(state)],
            };
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

          return {
            ...state,
            index,
            routes: [
              ...activeRoutes.slice(0, index),
              params !== route.params ? { ...route, params } : state.routes[index]!,
              ...getInactiveRoutes(state),
            ],
          };
        }

        case 'POP': {
          const activeRoutes = getActiveRoutes(state);
          const currentIndex =
            action.target === state.key && action.source
              ? activeRoutes.findIndex((r) => r.key === action.source)
              : state.index;

          if (currentIndex > 0) {
            const count = Math.max(currentIndex - action.payload.count + 1, 1);
            const routes = activeRoutes
              .slice(0, count)
              .concat(activeRoutes.slice(currentIndex + 1));

            return {
              ...state,
              index: routes.length - 1,
              routes: [...routes, ...getInactiveRoutes(state)],
            };
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
          const activeRoutes = getActiveRoutes(state);
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
            index = activeRoutes.findIndex(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
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
            let route = getInactiveRoutes(state).find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );

            if (!route) {
              route = createRouteFromAction({ action, routeParamList }, state);
            }

            const routes = activeRoutes.slice(0, currentIndex).concat(route);

            return {
              ...state,
              index: routes.length - 1,
              routes: [...routes, ...getInactiveRoutes(state).filter((r) => r.key !== route.key)],
            };
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

          return {
            ...state,
            index,
            routes: [
              ...activeRoutes.slice(0, index),
              params !== route.params ? { ...route, params } : state.routes[index]!,
              ...getInactiveRoutes(state),
            ],
          };
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
          const activeRoutes = getActiveRoutes(state);
          const inactiveRoutes = getInactiveRoutes(state);

          const getId = options.routeGetIdList[action.payload.name];
          const id = getId?.({ params: action.payload.params });

          let route: Route<string> | undefined;

          if (id !== undefined) {
            route = activeRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );
          }

          if (route) {
            return {
              ...state,
              routes: [
                ...activeRoutes.map((r) => {
                  if (r.key !== route?.key) {
                    return r;
                  }
                  return { ...r, params: createParamsFromAction({ action, routeParamList }) };
                }),
                ...inactiveRoutes,
              ],
            };
          }

          return {
            ...state,
            routes: [
              ...activeRoutes,
              ...inactiveRoutes
                .filter(
                  (r) => r.name !== action.payload.name || id !== getId?.({ params: r.params })
                )
                .concat(createRouteFromAction({ action, routeParamList }, state)),
            ],
          };
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    actionCreators: StackActions,
  };

  return router;
}
