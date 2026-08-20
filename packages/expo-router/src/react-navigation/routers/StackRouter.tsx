import { nanoid } from 'nanoid/non-secure';

import { isArrayEqual } from '../core/isArrayEqual';
import { BaseRouter } from './BaseRouter';
import { createRouteFromAction } from './createRouteFromAction';
import { ensureStateType } from './ensureStateType';
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
  type?: 'stack';
};

export function getStackRoutes<ParamList extends ParamListBase>(
  state: StackNavigationState<ParamList>
) {
  return {
    activeRoutes: state.routes.slice(0, state.index + 1),
    preloadedRoutes: state.routes.slice(state.index + 1),
  };
}

function reconcileStackRoutes<ParamList extends ParamListBase>(
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

/**
 * StackRouter is considered an internal implementation and its behavior may change without a notice between expo-router's version
 */
export function StackRouter(options: StackRouterOptions) {
  const { initialRouteName } = options;
  const router: Router<
    StackNavigationState<ParamListBase>,
    CommonNavigationAction | StackActionType
  > = {
    ...BaseRouter,

    // TODO: Keep this value in sync with the `ensureStateType` calls below.
    type: 'stack',

    getRehydratedState(partialState, { routeNames }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const index = state.index ?? state.routes.length - 1;
      const activeRoutes = state.routes.slice(0, index + 1);
      const stalePreloadedRoutes = state.routes.slice(index + 1);

      const routes: Route<string>[] = activeRoutes
        .filter((route) => routeNames.includes(route.name))
        .map((route) => ({
          ...route,
          key: route.key || `${route.name}-${nanoid()}`,
        }));

      const preloadedRoutes =
        stalePreloadedRoutes
          ?.filter((route) => routeNames.includes(route.name))
          .map(
            (route) =>
              ({
                ...route,
                key: route.key || `${route.name}-${nanoid()}`,
              }) as Route<string>
          ) ?? [];

      if (routes.length === 0) {
        const initialRouteName =
          options.initialRouteName !== undefined ? options.initialRouteName : routeNames[0]!;

        routes.push({
          key: `${initialRouteName}-${nanoid()}`,
          name: initialRouteName,
        });
      }

      return ensureStateType(
        {
          stale: false,
          key: `stack-${nanoid()}`,
          index: routes.length - 1,
          routeNames,
          routes: routes.concat(preloadedRoutes),
        },
        'stack'
      );
    },

    getStateForDeclaredRoutes(state, routeNames) {
      const filteredState = BaseRouter.getStateForDeclaredRoutes(state, routeNames);

      if (filteredState === state || filteredState.routes.length === 0) {
        return filteredState;
      }

      // Routes after `index` are preloaded, so the surviving prefix is the new active stack and its
      // last entry is the top. The default rule would focus the bottom of the stack instead.
      const declaredRouteNames = new Set(routeNames);
      const survivingActiveCount = getStackRoutes(state).activeRoutes.filter((route) =>
        declaredRouteNames.has(route.name)
      ).length;

      return { ...filteredState, index: Math.max(0, survivingActiveCount - 1) };
    },

    getStateForRouteFocus(inputState, key) {
      const state = ensureStateType(inputState, 'stack');
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

    getStateForAction(inputState, action, options) {
      const state = ensureStateType(inputState, 'stack');
      const { activeRoutes, preloadedRoutes } = getStackRoutes(state);

      switch (action.type) {
        case 'ROUTE_NAMES_CHANGED': {
          const routeNames = action.payload.routeNames;

          if (isArrayEqual(state.routeNames, routeNames)) {
            return state;
          }

          const routes = activeRoutes.filter((route) => routeNames.includes(route.name));
          const filteredPreloadedRoutes = preloadedRoutes.filter((route) =>
            routeNames.includes(route.name)
          );

          if (routes.length === 0) {
            const fallbackName =
              initialRouteName !== undefined && routeNames.includes(initialRouteName)
                ? initialRouteName
                : routeNames[0]!;

            const preloadedIndex = filteredPreloadedRoutes.findIndex(
              (route) => route.name === fallbackName
            );
            const fallbackRoute =
              preloadedIndex === -1
                ? {
                    key: `${fallbackName}-${nanoid()}`,
                    name: fallbackName,
                  }
                : filteredPreloadedRoutes[preloadedIndex]!;

            routes.push(fallbackRoute);
          }

          return {
            ...reconcileStackRoutes(state, routes, filteredPreloadedRoutes),
            routeNames,
          };
        }

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

          // Re-use preloaded route if available
          let route = preloadedRoutes.find(
            (route) =>
              route.name === action.payload.name && id === getId?.({ params: route.params })
          );

          if (!route) {
            route = createRouteFromAction({ action });
          }

          return reconcileStackRoutes(
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
              action.payload.params !== undefined
                ? {
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params = action.payload.params;
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

              // Promote the route when it is preloaded and therefore absent from the active routes.
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

          return reconcileStackRoutes(
            state,
            routes,
            preloadedRoutes.filter((route) => routes[routes.length - 1]!.key !== route.key)
          );
        }

        case 'REMOVE_ROUTES': {
          const focusedRoute = activeRoutes[state.index]!;
          const routes = activeRoutes.filter(
            (route) =>
              route.key === focusedRoute.key || !action.payload.routeNames.includes(route.name)
          );
          const nextPreloadedRoutes = preloadedRoutes.filter(
            (route) => !action.payload.routeNames.includes(route.name)
          );

          if (
            routes.length === activeRoutes.length &&
            nextPreloadedRoutes.length === preloadedRoutes.length
          ) {
            return state;
          }

          return reconcileStackRoutes(state, routes, nextPreloadedRoutes);
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

            return reconcileStackRoutes(state, routes);
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
            let route = preloadedRoutes.find(
              (route) =>
                route.name === action.payload.name && id === getId?.({ params: route.params })
            );

            if (!route) {
              route = createRouteFromAction({ action });
            }

            const routes = activeRoutes.slice(0, currentIndex).concat(route);

            return reconcileStackRoutes(
              state,
              routes,
              preloadedRoutes.filter((r) => r.key !== route.key)
            );
          }

          const route = activeRoutes[index]!;

          let params;

          if (action.payload.merge) {
            params =
              action.payload.params !== undefined
                ? {
                    ...route.params,
                    ...action.payload.params,
                  }
                : route.params;
          } else {
            params = action.payload.params;
          }

          return reconcileStackRoutes(state, [
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
            route = activeRoutes.find(
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
                  params: action.payload.params,
                };
              }),
            };
          } else {
            return {
              ...reconcileStackRoutes(
                state,
                activeRoutes,
                preloadedRoutes
                  .filter(
                    (r) => r.name !== action.payload.name || id !== getId?.({ params: r.params })
                  )
                  .concat(createRouteFromAction({ action }))
              ),
            };
          }
        }

        default: {
          const result = BaseRouter.getStateForAction(state, action);

          if (result === null || result.stale !== false) {
            return result;
          }

          return ensureStateType(result, 'stack');
        }
      }
    },

    actionCreators: StackActions,
  };

  return router;
}
