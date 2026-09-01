import { orderRoutesByRouteNames } from '../../utils/orderRoutesByRouteNames';
import { isSetEqual } from '../core/isSetEqual';
import { BaseRouter } from './BaseRouter';
import { attachRouteState, type RouteState } from './attachRouteState';
import { createRouteFromAction } from './createRouteFromAction';
import { ensureStateType } from './ensureStateType';
import { createRouteKeyMinter } from './stateKeys';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
  Route,
  Router,
} from './types';

export type TabActionType =
  | {
      type: 'JUMP_TO';
      payload: { name: string; params?: object; state?: RouteState };
      source?: string;
      target?: string;
    }
  | {
      type: 'REPLACE';
      payload: { name: string; params?: object; state?: RouteState };
      source?: string;
      target?: string;
    }
  | {
      type: 'PUSH';
      payload: { name: string; params?: object; state?: RouteState };
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
  initialRouteName: string | undefined,
  mintRouteKey: (name: string) => string
) => {
  if (routes.length > 0 || routeNames.length === 0) {
    return routes;
  }

  const name =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0]!;
  return [{ name, key: mintRouteKey(name) }];
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

export const ensureFullHistory = (
  state: TabNavigationState<ParamListBase>
): TabNavigationStateWithHistory => {
  if (state.history != null) {
    // The null check narrows the optional property, but TypeScript doesn't narrow the object type.
    return state as TabNavigationStateWithHistory;
  }

  const focusedRoute = state.routes[state.index];
  const history = focusedRoute
    ? [{ type: TYPE_ROUTE, key: focusedRoute.key, params: focusedRoute.params }]
    : [];

  return { ...state, history };
};

const stripHistory = (
  state: TabNavigationState<ParamListBase>
): TabNavigationState<ParamListBase> => {
  if (state.history === undefined) {
    return state;
  }
  const { history: _, ...stateWithoutHistory } = state;
  return stateWithoutHistory;
};

const changeFullHistoryIndex = (state: TabNavigationStateWithHistory, index: number) => {
  if (state.routes.length === 0) {
    return { ...state, index: -1, history: [] };
  }
  let history = state.history;

  const currentRoute = state.routes[index]!;
  const lastHistoryRouteItemIndex = history.findLastIndex((item) => item.type === 'route');
  if (currentRoute.key === history[lastHistoryRouteItemIndex]?.key) {
    history = [
      ...history.slice(0, lastHistoryRouteItemIndex),
      ...history.slice(lastHistoryRouteItemIndex + 1),
    ];
  }
  history = history.concat({
    type: TYPE_ROUTE,
    key: currentRoute.key,
    params: currentRoute.params,
  });

  return {
    ...state,
    index,
    history,
  };
};

const getAnchorName = (
  routeNames: string[],
  backBehavior: BackBehavior,
  initialRouteName: string | undefined
) =>
  backBehavior === 'initialRoute' &&
  initialRouteName !== undefined &&
  routeNames.includes(initialRouteName)
    ? initialRouteName
    : routeNames[0];

const changeIndex = (
  state: TabNavigationState<ParamListBase>,
  targetKey: string,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  routeNames: string[],
  mintRouteKey: (name: string) => string
): TabNavigationState<ParamListBase> => {
  if (state.routes.length === 0) {
    return { ...state, index: -1 };
  }

  const target = state.routes.find((route) => route.key === targetKey);
  if (!target) {
    return state;
  }

  if (backBehavior === 'fullHistory') {
    return changeFullHistoryIndex(
      state as TabNavigationStateWithHistory,
      state.routes.indexOf(target)
    );
  }

  if (backBehavior === 'none') {
    return { ...state, index: state.routes.indexOf(target) };
  }

  if (backBehavior === 'order') {
    const routes = orderRoutesByRouteNames(state.routes, routeNames);
    return { ...state, routes, index: routes.indexOf(target) };
  }

  if (backBehavior === 'history') {
    if (state.routes[state.index]?.key === targetKey) {
      return state;
    }
    const visited = state.routes
      .slice(0, state.index + 1)
      .filter((route) => route.key !== targetKey);
    const unvisited = state.routes
      .slice(state.index + 1)
      .filter((route) => route.key !== targetKey);
    return { ...state, routes: [...visited, target, ...unvisited], index: visited.length };
  }

  const anchorName = getAnchorName(routeNames, backBehavior, initialRouteName);
  if (anchorName === undefined) {
    return state;
  }
  const anchor =
    state.routes.find((route) => route.name === anchorName) ??
    ({ name: anchorName, key: mintRouteKey(anchorName) } as Route<string>);
  const rest = state.routes.filter((route) => route.key !== anchor.key && route.key !== target.key);
  return target.key === anchor.key
    ? { ...state, routes: [anchor, ...rest], index: 0 }
    : { ...state, routes: [anchor, target, ...rest], index: 1 };
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

    getStateForRouteFocus(inputState, key) {
      const normalizedState =
        backBehavior === 'fullHistory' ? ensureFullHistory(inputState) : stripHistory(inputState);
      const state = ensureStateType(normalizedState, 'tab');
      const route = state.routes.find((route) => route.key === key);

      if (!route || route.key === state.routes[state.index]?.key) {
        return state;
      }

      const minter = createRouteKeyMinter(state);
      const result = changeIndex(
        state,
        route.key,
        backBehavior,
        initialRouteName,
        state.routeNames,
        minter.mint
      );
      return { ...result, routeKeySeq: minter.routeKeySeq };
    },

    getStateForAction(inputState, action, { routeGetIdList, routeNames: declaredRouteNames }) {
      const normalizedState =
        backBehavior === 'fullHistory' ? ensureFullHistory(inputState) : stripHistory(inputState);
      const state = ensureStateType(normalizedState, 'tab');

      if (action.target && action.target !== state.key) {
        return null;
      }
      const minter = createRouteKeyMinter(state);

      switch (action.type) {
        case 'ROUTE_NAMES_CHANGED': {
          const routeNames = action.payload.routeNames;

          if (isSetEqual(state.routeNames, routeNames)) {
            return { state, affectedRouteKey: state.routes[state.index]?.key };
          }

          let routes = addFallbackRouteIfEmpty(
            state.routes.filter((route) => routeNames.includes(route.name)),
            routeNames,
            initialRouteName,
            minter.mint
          );

          if (backBehavior === 'order') {
            routes = orderRoutesByRouteNames(routes, routeNames);
          }

          const focusedKey = state.routes[state.index]?.key;
          const focusedIndex = routes.findIndex((route) => route.key === focusedKey);
          const index = routes.length === 0 ? -1 : Math.max(focusedIndex, 0);
          const history =
            backBehavior === 'fullHistory'
              ? state.history!.filter((item) => routes.some((route) => route.key === item.key))
              : undefined;

          return {
            state: {
              ...state,
              routeNames,
              routes,
              routeKeySeq: minter.routeKeySeq,
              index,
              ...(history === undefined ? undefined : { history }),
            },
            affectedRouteKey: routes[index]?.key,
          };
        }

        case 'ROUTE_NAMES_ORDER_CHANGED': {
          const routeNames = action.payload.routeNames;
          if (backBehavior !== 'order' || !isSetEqual(state.routeNames, routeNames)) {
            return null;
          }
          const focusedKey = state.routes[state.index]?.key;
          const routes = orderRoutesByRouteNames(state.routes, routeNames);
          const index =
            focusedKey === undefined ? -1 : routes.findIndex((route) => route.key === focusedKey);
          return {
            state: { ...state, routeNames, routes, index },
            affectedRouteKey: focusedKey,
          };
        }

        case 'PUSH':
        case 'REPLACE':
        case 'JUMP_TO':
        case 'NAVIGATE': {
          if (!declaredRouteNames.includes(action.payload.name)) {
            return null;
          }

          const { routes } = addRouteIfMissing(state.routes, action.payload.name, () => {
            const route = createRouteFromAction({
              action,
              key: minter.mint(action.payload.name),
            });
            return action.type === 'NAVIGATE' && action.payload.path != null
              ? { ...route, path: action.payload.path }
              : route;
          });

          const previousFocusedRoute = state.routes[state.index];
          const updatedRoutes = routes.map((route) => {
            if (route.name !== action.payload.name) {
              return route;
            }

            const getId = routeGetIdList[route.name];
            const currentId = getId?.({ params: route.params });
            const nextId = getId?.({ params: action.payload.params });
            const key = currentId === nextId ? route.key : minter.mint(route.name);

            let params;
            if (action.type === 'NAVIGATE' && action.payload.merge && currentId === nextId) {
              params =
                action.payload.params !== undefined
                  ? { ...route.params, ...action.payload.params }
                  : route.params;
            } else {
              params = action.payload.params;
            }

            const path =
              action.type === 'NAVIGATE' && action.payload.path != null
                ? action.payload.path
                : route.path;
            const updatedRoute =
              params !== route.params || path !== route.path || key !== route.key
                ? { ...route, key, path, params }
                : route;
            return attachRouteState(updatedRoute, action);
          });
          const targetRoute = updatedRoutes.find((route) => route.name === action.payload.name)!;
          let updatedState = changeIndex(
            {
              ...state,
              routes: updatedRoutes,
              routeKeySeq: minter.routeKeySeq,
            },
            targetRoute.key,
            backBehavior,
            initialRouteName,
            declaredRouteNames,
            minter.mint
          );

          if (action.type === 'REPLACE' && previousFocusedRoute) {
            updatedState = removeReplacedRoute(
              state,
              updatedState,
              previousFocusedRoute,
              backBehavior,
              initialRouteName,
              declaredRouteNames
            );
          }
          return {
            state: updatedState,
            affectedRouteKey: updatedState.routes[updatedState.index]?.key,
          };
        }

        case 'SET_PARAMS':
        case 'REPLACE_PARAMS': {
          const actionResult = BaseRouter.getStateForAction(state, action);

          if (actionResult !== null && backBehavior === 'fullHistory') {
            const nextState = actionResult.state;
            const index = nextState.index;

            if (index != null) {
              const focusedRoute = nextState.routes[index]!;
              const historyItemIndex = state.history!.findLastIndex(
                (item) => item.key === focusedRoute.key
              );

              let updatedHistory = state.history!;

              if (historyItemIndex !== -1) {
                updatedHistory = [...state.history!];
                updatedHistory[historyItemIndex] = {
                  ...updatedHistory[historyItemIndex]!,
                  params: focusedRoute.params,
                };
              }

              return {
                ...actionResult,
                state: {
                  ...nextState,
                  history: updatedHistory,
                },
              };
            }
          }

          return actionResult;
        }

        case 'GO_BACK': {
          if (backBehavior === 'none') {
            return null;
          }

          const focusedRoute = state.routes[state.index];
          if (!focusedRoute) {
            return null;
          }
          if (backBehavior !== 'fullHistory') {
            if (state.index > 0) {
              const index = state.index - 1;
              return {
                state: { ...state, index },
                affectedRouteKey: state.routes[index]!.key,
              };
            }
            if (backBehavior === 'firstRoute' || backBehavior === 'initialRoute') {
              const anchorName = getAnchorName(declaredRouteNames, backBehavior, initialRouteName);
              const existingAnchor = state.routes.find((route) => route.name === anchorName);
              if (
                anchorName !== undefined &&
                focusedRoute.name !== anchorName &&
                existingAnchor === undefined
              ) {
                const anchor = { name: anchorName, key: minter.mint(anchorName) };
                const routes = [
                  anchor,
                  focusedRoute,
                  ...state.routes.filter(
                    (route) => route.key !== anchor.key && route.key !== focusedRoute.key
                  ),
                ];
                return {
                  state: { ...state, routes, index: 0, routeKeySeq: minter.routeKeySeq },
                  affectedRouteKey: anchor.key,
                };
              }
            }
            return null;
          }

          if (state.history!.length === 1) {
            return null;
          }

          const previousHistoryItem = state.history![state.history!.length - 2];
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
            state: {
              ...state,
              routes,
              history: state.history!.slice(0, -1),
              index,
            },
            affectedRouteKey: routes[index]!.key,
          };
        }

        case 'PRELOAD': {
          if (!declaredRouteNames.includes(action.payload.name)) {
            return null;
          }

          const routeIndex = state.routes.findIndex((route) => route.name === action.payload.name);
          let affectedRouteKey: string;
          let replacedKey: string | undefined;
          let routes: Route<string>[];
          let index = state.index;

          if (routeIndex === -1) {
            const route = attachRouteState(
              createRouteFromAction({ action, key: minter.mint(action.payload.name) }),
              action
            );
            routes = [...state.routes, route];
            if (backBehavior === 'order') {
              const focusedKey = state.routes[state.index]?.key;
              routes = orderRoutesByRouteNames(routes, declaredRouteNames);
              index = routes.findIndex((route) => route.key === focusedKey);
            }
            affectedRouteKey = route.key;
          } else {
            const route = state.routes[routeIndex]!;
            const getId = routeGetIdList[route.name];
            const currentId = getId?.({ params: route.params });
            const nextId = getId?.({ params: action.payload.params });
            const key = currentId === nextId ? route.key : minter.mint(route.name);
            const params = action.payload.params;
            const newRoute = attachRouteState(
              params !== route.params ? { ...route, key, params } : route,
              action
            );

            replacedKey = key === route.key ? undefined : route.key;
            routes = state.routes.map((route, index) => (index === routeIndex ? newRoute : route));
            affectedRouteKey = newRoute.key;
          }

          let history = state.history;

          if (backBehavior === 'fullHistory' && replacedKey !== undefined) {
            // Re-key in place, so the focused route stays the last history entry for `goBack`.
            // Only the newest entry takes the new params - `fullHistory` keeps duplicate entries
            // and each older one still holds the params of its own visit.
            const newRoute = routes[routeIndex]!;
            const newestIndex = history!.findLastIndex(
              (record) => record.type === TYPE_ROUTE && record.key === replacedKey
            );

            history = history!.map((record, index) =>
              record.type === TYPE_ROUTE && record.key === replacedKey
                ? {
                    ...record,
                    key: newRoute.key,
                    params: index === newestIndex ? newRoute.params : record.params,
                  }
                : record
            );
          }

          return {
            state: {
              ...state,
              index,
              routes,
              routeKeySeq: minter.routeKeySeq,
              ...(history === undefined ? undefined : { history }),
            },
            affectedRouteKey,
          };
        }

        default: {
          const result = BaseRouter.getStateForAction(state, action);

          if (result === null) {
            return result;
          }

          return {
            ...result,
            state: ensureStateType(
              backBehavior === 'fullHistory'
                ? ensureFullHistory(result.state as TabNavigationState<ParamListBase>)
                : stripHistory(result.state as TabNavigationState<ParamListBase>),
              state.type
            ),
          };
        }
      }
    },

    actionCreators: TabActions,
  };

  return router;
}

function removeReplacedRoute(
  previousState: TabNavigationState<ParamListBase>,
  nextState: TabNavigationState<ParamListBase>,
  replacedRoute: Route<string>,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  routeNames: string[]
) {
  const focusedRouteKey = nextState.routes[nextState.index]?.key;
  if (replacedRoute.key === focusedRouteKey) {
    return nextState;
  }

  if (backBehavior === 'fullHistory') {
    const history = nextState.history!;
    const replacedIndex = history.findLastIndex((item) => item.key === replacedRoute.key);
    if (replacedIndex === -1) {
      return nextState;
    }
    return {
      ...nextState,
      history: history.filter((_, index) => index !== replacedIndex),
    };
  }

  if (backBehavior === 'history') {
    const routes = nextState.routes.filter((route) => route.key !== replacedRoute.key);
    const index = routes.findIndex((route) => route.key === focusedRouteKey);
    routes.splice(index + 1, 0, replacedRoute);
    return { ...nextState, routes, index };
  }

  const anchorName = getAnchorName(routeNames, backBehavior, initialRouteName);
  if (
    (backBehavior !== 'firstRoute' && backBehavior !== 'initialRoute') ||
    replacedRoute.name !== anchorName
  ) {
    return nextState;
  }

  const routes = nextState.routes.filter((route) => route.key !== replacedRoute.key);
  const index = routes.findIndex((route) => route.key === focusedRouteKey);
  return {
    ...nextState,
    routes: [
      routes[index]!,
      replacedRoute,
      ...routes.filter((_, routeIndex) => routeIndex !== index),
    ],
    index: 0,
  };
}
