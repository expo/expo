import { nanoid } from 'nanoid/non-secure';

import { orderRoutesByRouteNames } from '../../utils/orderRoutesByRouteNames';
import { isArrayEqual } from '../core/isArrayEqual';
import { BaseRouter } from './BaseRouter';
import { createRouteFromAction } from './createRouteFromAction';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
  PartialState,
  Route,
  Router,
} from './types';

export type TabActionType =
  | {
      type: 'JUMP_TO';
      payload: { name: string; params?: object };
      source?: string;
      target?: string;
    }
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
    };

export type BackBehavior =
  | 'firstRoute'
  | 'initialRoute'
  | 'order'
  | 'history'
  | 'fullHistory'
  | 'none';

export type TabRouterOptions = DefaultRouterOptions & {
  /**
   * Control how going back should behave
   * - `firstRoute` - return to the first defined route
   * - `initialRoute` - return to the route from `initialRouteName`
   * - `order` - return to the route defined before the focused route
   * - `history` - return to last visited route; if the same route is visited multiple times, the older entries are dropped from the history
   * - `fullHistory` - return to last visited route; doesn't drop duplicate entries unlike `history` - matches behavior of web pages
   * - `none` - do not handle going back
   */
  backBehavior?: BackBehavior;
};

export type TabNavigationState<ParamList extends ParamListBase> = Omit<
  NavigationState<ParamList>,
  'history'
> & {
  /**
   * Type of the router, in this case, it's tab.
   */
  type?: 'tab';
  /**
   * List of previously visited route keys.
   */
  history?: { type: 'route'; key: string; params?: object | undefined }[];
};

export type TabActionHelpers<ParamList extends ParamListBase> = {
  /**
   * Replaces the current tab with another tab.
   *
   * @param screen Name of the tab that will replace the current one.
   * @param [params] Params object for the new tab.
   */
  replace<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;

  /**
   * Jump to an existing tab.
   *
   * @param screen Name of the route to jump to.
   * @param [params] Params object for the route.
   */
  jumpTo<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;
};

type TabNavigationStateWithHistory = TabNavigationState<ParamListBase> &
  Required<Pick<TabNavigationState<ParamListBase>, 'history'>>;

const TYPE_ROUTE = 'route' as const;

const addFallbackRouteIfEmpty = (
  routes: Route<string>[],
  routeNames: string[],
  initialRouteName: string | undefined
) => {
  if (routes.length > 0 || routeNames.length === 0) {
    return routes;
  }

  const name =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0]!;
  return [{ name, key: `${name}-${nanoid()}` }];
};

const addRouteIfMissing = (
  routes: Route<string>[],
  name: string,
  createRoute: () => Route<string>
) => {
  const existingIndex = routes.findIndex((route) => route.name === name);
  if (existingIndex !== -1) {
    return { routes, index: existingIndex };
  }

  return { routes: [...routes, createRoute()], index: routes.length };
};

export const TabActions = {
  jumpTo(name: string, params?: object) {
    return {
      type: 'JUMP_TO',
      payload: { name, params },
    } as const satisfies TabActionType;
  },
  replace(name: string, params?: object) {
    return {
      type: 'REPLACE',
      payload: { name, params },
    } as const satisfies TabActionType;
  },
};

const getRouteHistory = (
  routes: Route<string>[],
  index: number,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
): NonNullable<TabNavigationState<ParamListBase>['history']> => {
  if (routes.length === 0) {
    return [];
  }
  const history = [
    {
      type: TYPE_ROUTE,
      key: routes[index]!.key,
    },
  ];

  let initialRouteIndex;

  switch (backBehavior) {
    case 'order':
      for (let i = index; i > 0; i--) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[i - 1]!.key,
        });
      }
      break;
    case 'firstRoute':
      if (index !== 0) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[0]!.key,
        });
      }
      break;
    case 'initialRoute':
      initialRouteIndex = routes.findIndex((route) => route.name === initialRouteName);
      initialRouteIndex = initialRouteIndex === -1 ? 0 : initialRouteIndex;

      if (index !== initialRouteIndex) {
        history.unshift({
          type: TYPE_ROUTE,
          key: routes[initialRouteIndex]!.key,
        });
      }
      break;
    case 'history':
    case 'fullHistory':
      // The history will fill up on navigation
      break;
  }

  return history;
};

export const ensureStateHistory = (
  state: TabNavigationState<ParamListBase>,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
): TabNavigationStateWithHistory => {
  if (state.history != null) {
    // The null check narrows the optional property, but TypeScript doesn't narrow the object type.
    return state as TabNavigationStateWithHistory;
  }

  const routes = orderRoutesByRouteNames(state.routes, state.routeNames);
  const focusedRoute = state.routes[state.index];
  const index = routes.findIndex((route) => route.key === focusedRoute?.key);

  // `orderRoutesByRouteNames` drops undeclared routes, so the focused one can be missing from
  // `routes`. Keep it in history anyway, so the current route is always the last entry.
  const history =
    index === -1
      ? focusedRoute === undefined
        ? []
        : [{ type: TYPE_ROUTE, key: focusedRoute.key }]
      : getRouteHistory(routes, index, backBehavior, initialRouteName);

  if (backBehavior === 'fullHistory' && focusedRoute !== undefined) {
    history[history.length - 1] = {
      ...history[history.length - 1]!,
      params: focusedRoute.params,
    };
  }

  return { ...state, history };
};

const changeIndex = (
  state: TabNavigationStateWithHistory,
  index: number,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
) => {
  if (state.routes.length === 0) {
    return { ...state, index: -1, history: [] };
  }
  let history = state.history;

  if (backBehavior === 'history' || backBehavior === 'fullHistory') {
    const currentRoute = state.routes[index]!;

    if (backBehavior === 'history') {
      // Remove the existing key from the history to de-duplicate it
      history = history.filter((it) => (it.type === 'route' ? it.key !== currentRoute.key : false));
    } else if (backBehavior === 'fullHistory') {
      const lastHistoryRouteItemIndex = history.findLastIndex((item) => item.type === 'route');

      if (currentRoute.key === history[lastHistoryRouteItemIndex]?.key) {
        // For full-history, only remove if it matches the last route
        // Useful for drawer, if current route was in history, then drawer state changed
        // Then we only need to move the route to the front
        history = [
          ...history.slice(0, lastHistoryRouteItemIndex),
          ...history.slice(lastHistoryRouteItemIndex + 1),
        ];
      }
    }

    history = history.concat({
      type: TYPE_ROUTE,
      key: currentRoute.key,
      params: backBehavior === 'fullHistory' ? currentRoute.params : undefined,
    });
  } else {
    const routes = orderRoutesByRouteNames(state.routes, state.routeNames);
    const orderedIndex = routes.findIndex((route) => route.key === state.routes[index]!.key);
    history = getRouteHistory(routes, orderedIndex, backBehavior, initialRouteName);
  }

  return {
    ...state,
    index,
    history,
  };
};

/**
 * TabRouter is considered an internal implementation and its behavior may change without a notice between expo-router's version
 */
export function TabRouter({
  initialRouteName,
  backBehavior = 'firstRoute',
}: TabRouterOptions): Router<
  TabNavigationState<ParamListBase>,
  TabActionType | CommonNavigationAction
> {
  // TODO: Simplify the action handling in this router.
  const router: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...BaseRouter,

    type: 'tab',

    getRehydratedState(partialState, { routeNames }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const partialRoutes = (state as PartialState<TabNavigationState<ParamListBase>>).routes;
      const filteredRoutes = partialRoutes
        .filter((route) => routeNames.includes(route.name))
        .map((route) => ({
          ...route,
          key: route.key || `${route.name}-${nanoid()}`,
        }));
      const routes = addFallbackRouteIfEmpty(filteredRoutes, routeNames, initialRouteName);

      const focusedName = state.routes[state.index ?? 0]?.name;
      const focusedIndex = routes.findIndex((route) => route.name === focusedName);
      const index = Math.min(Math.max(focusedIndex, 0), routes.length - 1);

      const routeKeys = routes.map((route) => route.key);

      const history = state.history?.filter((it) => routeKeys.includes(it.key)) ?? [];

      return changeIndex(
        {
          stale: false,
          type: 'tab',
          key: `tab-${nanoid()}`,
          index,
          routeNames,
          history,
          routes,
        },
        index,
        backBehavior,
        initialRouteName
      );
    },

    getStateForRouteFocus(inputState, key) {
      const state = ensureStateHistory(inputState, backBehavior, initialRouteName);
      const index = state.routes.findIndex((r) => r.key === key);

      if (index === -1 || index === state.index) {
        return state;
      }

      return changeIndex(state, index, backBehavior, initialRouteName);
    },

    getStateForAction(inputState, action, { routeGetIdList }) {
      const state = ensureStateHistory(inputState, backBehavior, initialRouteName);

      if (action.target && action.target !== state.key) {
        return null;
      }

      switch (action.type) {
        case 'ROUTE_NAMES_CHANGED': {
          const routeNames = action.payload.routeNames;

          if (isArrayEqual(state.routeNames, routeNames)) {
            return state;
          }

          const routes = addFallbackRouteIfEmpty(
            state.routes.filter((route) => routeNames.includes(route.name)),
            routeNames,
            initialRouteName
          );

          if (routes.length === 0) {
            return {
              ...state,
              routeNames,
              routes,
              index: -1,
              history: [],
            };
          }

          const focusedKey = state.routes[state.index]?.key;
          const focusedIndex = routes.findIndex((route) => route.key === focusedKey);
          const index = Math.max(focusedIndex, 0);
          const routeKeys = routes.map((route) => route.key);
          let history = state.history.filter(
            (item) => item.type !== 'route' || routeKeys.includes(item.key)
          );

          if (
            focusedIndex === -1 &&
            (backBehavior === 'history' || backBehavior === 'fullHistory')
          ) {
            const currentRoute = routes[index]!;
            const nonRouteHistory = history.filter((item) => item.type !== 'route');
            let routeHistory = history.filter((item) => item.type === 'route');

            if (backBehavior === 'history') {
              routeHistory = routeHistory.filter((item) => item.key !== currentRoute.key);
            } else if (routeHistory[routeHistory.length - 1]?.key === currentRoute.key) {
              routeHistory = routeHistory.slice(0, -1);
            }

            history = [
              ...routeHistory,
              {
                type: TYPE_ROUTE,
                key: currentRoute.key,
                params: backBehavior === 'fullHistory' ? currentRoute.params : undefined,
              },
              ...nonRouteHistory,
            ];
          }

          if (
            backBehavior === 'firstRoute' ||
            backBehavior === 'initialRoute' ||
            backBehavior === 'order'
          ) {
            const orderedRoutes = orderRoutesByRouteNames(routes, routeNames);
            const orderedIndex = orderedRoutes.findIndex(
              (route) => route.key === routes[index]!.key
            );
            history = [
              ...getRouteHistory(orderedRoutes, orderedIndex, backBehavior, initialRouteName),
              ...history.filter((item) => item.type !== 'route'),
            ];
          } else if (!history.some((item) => item.type === 'route')) {
            history = [
              ...getRouteHistory(routes, index, backBehavior, initialRouteName),
              ...history.filter((item) => item.type !== 'route'),
            ];
          }

          return {
            ...state,
            history,
            routeNames,
            routes,
            index,
          };
        }

        case 'PUSH':
        case 'REPLACE':
        case 'JUMP_TO':
        case 'NAVIGATE': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const { routes, index } = addRouteIfMissing(state.routes, action.payload.name, () => {
            const route = createRouteFromAction({ action });
            return action.type === 'NAVIGATE' && action.payload.path != null
              ? { ...route, path: action.payload.path }
              : route;
          });

          const updatedState = changeIndex(
            {
              ...state,
              routes: routes.map((route) => {
                if (route.name !== action.payload.name) {
                  return route;
                }

                const getId = routeGetIdList[route.name];

                const currentId = getId?.({ params: route.params });
                const nextId = getId?.({ params: action.payload.params });

                const key = currentId === nextId ? route.key : `${route.name}-${nanoid()}`;

                let params;

                if (action.type === 'NAVIGATE' && action.payload.merge && currentId === nextId) {
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

                const path =
                  action.type === 'NAVIGATE' && action.payload.path != null
                    ? action.payload.path
                    : route.path;

                return params !== route.params || path !== route.path
                  ? { ...route, key, path, params }
                  : route;
              }),
            },
            index,
            backBehavior,
            initialRouteName
          );

          return action.type === 'REPLACE'
            ? removeReplacedRouteFromHistory(state, updatedState)
            : updatedState;
        }

        case 'SET_PARAMS':
        case 'REPLACE_PARAMS': {
          const nextState = BaseRouter.getStateForAction(state, action);

          if (nextState !== null) {
            const index = nextState.index;

            if (index != null) {
              const focusedRoute = nextState.routes[index]!;
              const historyItemIndex = state.history.findLastIndex(
                (item) => item.key === focusedRoute.key
              );

              let updatedHistory = state.history;

              if (historyItemIndex !== -1) {
                updatedHistory = [...state.history];
                updatedHistory[historyItemIndex] = {
                  ...updatedHistory[historyItemIndex]!,
                  params: focusedRoute.params,
                };
              }

              return {
                ...nextState,
                history: updatedHistory,
              };
            }
          }

          return nextState;
        }

        case 'GO_BACK': {
          if (backBehavior === 'none') {
            return null;
          }

          const focusedRoute = state.routes[state.index];
          if (!focusedRoute) {
            return null;
          }
          let backTargetName: string | undefined;

          if (backBehavior === 'firstRoute') {
            backTargetName = state.routeNames[0];
          } else if (backBehavior === 'initialRoute') {
            backTargetName =
              initialRouteName !== undefined && state.routeNames.includes(initialRouteName)
                ? initialRouteName
                : state.routeNames[0];
          } else if (backBehavior === 'order') {
            const declaredIndex = state.routeNames.indexOf(focusedRoute.name);
            backTargetName = declaredIndex > 0 ? state.routeNames[declaredIndex - 1] : undefined;
          }

          if (backTargetName !== undefined && backTargetName !== focusedRoute.name) {
            const { routes, index } = addRouteIfMissing(state.routes, backTargetName, () => ({
              name: backTargetName,
              key: `${backTargetName}-${nanoid()}`,
            }));

            if (routes !== state.routes) {
              return changeIndex({ ...state, routes }, index, backBehavior, initialRouteName);
            }
          }

          if (state.history.length === 1) {
            return null;
          }

          const previousHistoryItem = state.history[state.history.length - 2];
          const previousKey = previousHistoryItem?.key;
          const index = state.routes.findLastIndex((route) => route.key === previousKey);

          if (index === -1) {
            return null;
          }

          let routes = state.routes;

          if (
            backBehavior === 'fullHistory' &&
            routes[index]!.params !== previousHistoryItem!.params
          ) {
            routes = [...state.routes];
            routes[index] = {
              ...routes[index]!,
              params: previousHistoryItem!.params,
            };
          }

          return {
            ...state,
            routes,
            history: state.history.slice(0, -1),
            index,
          };
        }

        case 'PRELOAD': {
          if (!state.routeNames.includes(action.payload.name)) {
            return null;
          }

          const routeIndex = state.routes.findIndex((route) => route.name === action.payload.name);
          let replacedKey: string | undefined;
          let routes: Route<string>[];

          if (routeIndex === -1) {
            const route = createRouteFromAction({ action });
            routes = [...state.routes, route];
          } else {
            const route = state.routes[routeIndex]!;
            const getId = routeGetIdList[route.name];
            const currentId = getId?.({ params: route.params });
            const nextId = getId?.({ params: action.payload.params });
            const key = currentId === nextId ? route.key : `${route.name}-${nanoid()}`;
            const params = action.payload.params;
            const newRoute = params !== route.params ? { ...route, key, params } : route;

            replacedKey = key === route.key ? undefined : route.key;
            routes = state.routes.map((route, index) => (index === routeIndex ? newRoute : route));
          }

          let history = state.history;

          if (backBehavior === 'history' || backBehavior === 'fullHistory') {
            if (replacedKey !== undefined) {
              // Re-key in place, so the focused route stays the last history entry for `goBack`.
              // Only the newest entry takes the new params - `fullHistory` keeps duplicate entries
              // and each older one still holds the params of its own visit.
              const newRoute = routes[routeIndex]!;
              const newestIndex = history.findLastIndex(
                (record) => record.type === TYPE_ROUTE && record.key === replacedKey
              );

              history = history.map((record, index) =>
                record.type === TYPE_ROUTE && record.key === replacedKey
                  ? {
                      ...record,
                      key: newRoute.key,
                      params:
                        backBehavior === 'fullHistory' && index === newestIndex
                          ? newRoute.params
                          : record.params,
                    }
                  : record
              );
            }
          } else {
            const orderedRoutes = orderRoutesByRouteNames(routes, state.routeNames);
            const focusedKey = routes[state.index]?.key;
            const focusedIndex = orderedRoutes.findIndex((route) => route.key === focusedKey);
            const routeHistory =
              focusedIndex === -1
                ? []
                : getRouteHistory(orderedRoutes, focusedIndex, backBehavior, initialRouteName);

            // TODO: Refactor history handling together with web state synchronization.
            history = [...routeHistory, ...history.filter((item) => item.type !== 'route')];
          }

          return {
            ...state,
            routes,
            history,
          };
        }

        default:
          return BaseRouter.getStateForAction(state, action);
      }
    },

    actionCreators: TabActions,
  };

  return router;
}

function removeReplacedRouteFromHistory(
  previousState: TabNavigationStateWithHistory,
  nextState: TabNavigationStateWithHistory
) {
  const replacedRouteKey = previousState.routes[previousState.index]?.key;
  const focusedRouteKey = nextState.routes[nextState.index]?.key;
  if (!replacedRouteKey || replacedRouteKey === focusedRouteKey) {
    return nextState;
  }

  const replacedIndex = nextState.history.findLastIndex((item) => item.key === replacedRouteKey);
  if (replacedIndex === -1) {
    return nextState;
  }

  return {
    ...nextState,
    history: nextState.history.filter((_, index) => index !== replacedIndex),
  };
}
