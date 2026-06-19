import { nanoid } from 'nanoid/non-secure';

import type { StackActionType } from '../core';
import { BaseRouter } from './BaseRouter';
import { createParamsFromAction } from './createParamsFromAction';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationState,
  ParamListBase,
  PartialState,
  Route,
  Router,
} from './types';

export type TabActionType = {
  type: 'JUMP_TO';
  payload: { name: string; params?: object };
  source?: string;
  target?: string;
};

export type BackBehavior = 'firstRoute' | 'initialRoute' | 'order' | 'history' | 'none';

export type TabRouterOptions = DefaultRouterOptions & {
  /**
   * Control how going back should behave
   * - `firstRoute` - return to the first defined route
   * - `initialRoute` - return to the route from `initialRouteName`
   * - `order` - return to the route defined before the focused route
   * - `history` - return to the previously focused route
   * - `none` - do not handle going back
   */
  backBehavior?: BackBehavior;
};

export type TabNavigationState<ParamList extends ParamListBase> = Omit<
  NavigationState<ParamList>,
  'history'
> & {
  /**
   * List of routes' key, which are supposed to be preloaded before navigating to.
   */
  preloadedRouteKeys: string[];
};

export type TabActionHelpers<ParamList extends ParamListBase> = {
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

export const TabActions = {
  jumpTo(name: string, params?: object) {
    return {
      type: 'JUMP_TO',
      payload: { name, params },
    } as const satisfies TabActionType;
  },
};

const focusRouteInHistory = (
  routes: Route<string>[],
  fromIndex: number,
  focusedIndex: number,
  route: Route<string>
): { routes: Route<string>[]; index: number } => {
  const next = routes.filter((_, i) => i !== fromIndex);
  const insertAt = fromIndex <= focusedIndex ? focusedIndex : focusedIndex + 1;
  next.splice(insertAt, 0, route);
  return { routes: next, index: insertAt };
};

const arrangeBackStack = (
  routes: Route<string>[],
  focusedName: string,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  routeNames: string[]
): { routes: Route<string>[]; index: number } => {
  const byName = (name: string) => routes.find((route) => route.name === name)!;

  if (backBehavior === 'order' || backBehavior === 'none') {
    return { routes: routeNames.map(byName), index: routeNames.indexOf(focusedName) };
  }

  const anchorName =
    backBehavior === 'initialRoute' &&
    initialRouteName !== undefined &&
    routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0]!;

  const others = routeNames
    .filter((name) => name !== anchorName && name !== focusedName)
    .map(byName);

  if (focusedName === anchorName) {
    return { routes: [byName(anchorName), ...others], index: 0 };
  }

  return { routes: [byName(anchorName), byName(focusedName), ...others], index: 1 };
};

const focusRoute = (
  routes: Route<string>[],
  focused: Route<string>,
  fromIndex: number,
  currentIndex: number,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  routeNames: string[]
): { routes: Route<string>[]; index: number } => {
  if (backBehavior === 'history') {
    return focusRouteInHistory(routes, fromIndex, currentIndex, focused);
  }

  return arrangeBackStack(
    routes.map((route, i) => (i === fromIndex ? focused : route)),
    focused.name,
    backBehavior,
    initialRouteName,
    routeNames
  );
};

export const pruneReplacedRoute = (
  state: TabNavigationState<ParamListBase>
): TabNavigationState<ParamListBase> => {
  if (state.index <= 0) {
    return state;
  }

  const replacedIndex = state.index - 1;
  const replaced = state.routes[replacedIndex]!;
  const routes = state.routes.filter((_, i) => i !== replacedIndex);
  routes.splice(state.index, 0, replaced);

  return { ...state, routes, index: state.index - 1 };
};

// TODO(@ubax): unify the logic into single router instead of BaseTabRouter and override
// TODO(@ubax): add REPLACE action to CommonAction type and handle it in all routers
function BaseTabRouter({ initialRouteName, backBehavior = 'firstRoute' }: TabRouterOptions) {
  const router: Router<
    TabNavigationState<ParamListBase>,
    TabActionType | CommonNavigationAction
  > = {
    ...BaseRouter,

    getInitialState({ routeNames, routeParamList }) {
      const initialIndex =
        initialRouteName !== undefined && routeNames.includes(initialRouteName)
          ? routeNames.indexOf(initialRouteName)
          : 0;

      const declarationRoutes = routeNames.map((name) => ({
        name,
        key: `${name}-${nanoid()}`,
        params: routeParamList[name],
      }));

      const { routes, index } =
        backBehavior === 'history'
          ? {
              routes: [
                declarationRoutes[initialIndex]!,
                ...declarationRoutes.filter((_, i) => i !== initialIndex),
              ],
              index: 0,
            }
          : arrangeBackStack(
              declarationRoutes,
              routeNames[initialIndex]!,
              backBehavior,
              initialRouteName,
              routeNames
            );

      return {
        stale: false,
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        routes,
        preloadedRouteKeys: [],
      };
    },

    getRehydratedState(partialState, { routeNames, routeParamList }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const partialRoutes = (state as PartialState<TabNavigationState<ParamListBase>>).routes;

      const buildRoute = (name: string, route: Route<string> | undefined) =>
        ({
          ...route,
          name,
          key: route && route.name === name && route.key ? route.key : `${name}-${nanoid()}`,
          params:
            routeParamList[name] !== undefined
              ? {
                  ...routeParamList[name],
                  ...(route ? route.params : undefined),
                }
              : route
                ? route.params
                : undefined,
        }) as Route<string>;

      const seen = new Set<string>();
      const rebuilt: Route<string>[] = [];

      for (const route of partialRoutes) {
        if (routeNames.includes(route.name) && !seen.has(route.name)) {
          seen.add(route.name);
          rebuilt.push(buildRoute(route.name, route as Route<string>));
        }
      }

      for (const name of routeNames) {
        if (!seen.has(name)) {
          seen.add(name);
          rebuilt.push(buildRoute(name, undefined));
        }
      }

      const persistedFocusedName = partialRoutes[state?.index ?? 0]?.name;
      const focusedName =
        persistedFocusedName !== undefined && seen.has(persistedFocusedName)
          ? persistedFocusedName
          : rebuilt[0]!.name;

      const { routes, index } =
        backBehavior === 'history'
          ? { routes: rebuilt, index: rebuilt.findIndex((route) => route.name === focusedName) }
          : arrangeBackStack(rebuilt, focusedName, backBehavior, initialRouteName, routeNames);

      const routeKeys = routes.map((route) => route.key);

      return {
        stale: false,
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        routes,
        preloadedRouteKeys:
          state.preloadedRouteKeys?.filter((key) => routeKeys.includes(key)) ?? [],
      };
    },

    getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
      const seen = new Set<string>();
      const rebuilt: Route<string>[] = [];

      for (const route of state.routes) {
        if (
          routeNames.includes(route.name) &&
          !routeKeyChanges.includes(route.name) &&
          !seen.has(route.name)
        ) {
          seen.add(route.name);
          rebuilt.push(route);
        }
      }

      for (const name of routeNames) {
        if (!seen.has(name)) {
          seen.add(name);
          rebuilt.push({
            name,
            key: `${name}-${nanoid()}`,
            params: routeParamList[name],
          });
        }
      }

      const previousFocusedName = state.routes[state.index]!.name;
      const focusedName = seen.has(previousFocusedName) ? previousFocusedName : rebuilt[0]!.name;

      const { routes, index } =
        backBehavior === 'history'
          ? { routes: rebuilt, index: rebuilt.findIndex((route) => route.name === focusedName) }
          : arrangeBackStack(rebuilt, focusedName, backBehavior, initialRouteName, routeNames);

      return {
        ...state,
        routeNames,
        routes,
        index,
      };
    },

    getStateForRouteFocus(state, key) {
      const fromIndex = state.routes.findIndex((r) => r.key === key);

      if (fromIndex === -1 || fromIndex === state.index) {
        return state;
      }

      const { routes, index } = focusRoute(
        state.routes,
        state.routes[fromIndex]!,
        fromIndex,
        state.index,
        backBehavior,
        initialRouteName,
        state.routeNames
      );

      return { ...state, routes, index };
    },

    getStateForAction(state, action, { routeNames, routeParamList, routeGetIdList }) {
      switch (action.type) {
        case 'JUMP_TO':
        case 'NAVIGATE':
        // @ts-expect-error PUSH is not part of tab actions
        case 'PUSH':
        case 'NAVIGATE_DEPRECATED': {
          const index = state.routes.findIndex((route) => route.name === action.payload.name);

          if (index === -1) {
            return null;
          }

          const route = state.routes[index]!;

          const getId = routeGetIdList[route.name];

          const currentId = getId?.({ params: route.params });
          const nextId = getId?.({ params: action.payload.params });

          const key = currentId === nextId ? route.key : `${route.name}-${nanoid()}`;

          let params;

          if (
            (action.type === 'NAVIGATE' || action.type === 'NAVIGATE_DEPRECATED') &&
            action.payload.merge &&
            currentId === nextId
          ) {
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

          const path =
            action.type === 'NAVIGATE' && action.payload.path != null
              ? action.payload.path
              : route.path;

          const updatedRoute =
            params !== route.params || path !== route.path || key !== route.key
              ? { ...route, key, path, params }
              : route;

          if (updatedRoute === route && index === state.index) {
            return state;
          }

          const { routes, index: newIndex } = focusRoute(
            state.routes,
            updatedRoute,
            index,
            state.index,
            backBehavior,
            initialRouteName,
            routeNames
          );

          return {
            ...state,
            routes,
            index: newIndex,
            preloadedRouteKeys: state.preloadedRouteKeys.filter((k) => k !== updatedRoute.key),
          };
        }

        case 'SET_PARAMS':
        case 'REPLACE_PARAMS':
          return BaseRouter.getStateForAction(state, action);

        case 'GO_BACK': {
          if (backBehavior === 'none' || state.index <= 0) {
            return null;
          }

          const index = state.index - 1;

          return {
            ...state,
            index,
            preloadedRouteKeys: state.preloadedRouteKeys.filter(
              (k) => k !== state.routes[index]!.key
            ),
          };
        }

        case 'PRELOAD': {
          const routeIndex = state.routes.findIndex((route) => route.name === action.payload.name);

          if (routeIndex === -1) {
            return null;
          }

          const route = state.routes[routeIndex]!;

          const getId = routeGetIdList[route.name];

          const currentId = getId?.({ params: route.params });
          const nextId = getId?.({ params: action.payload.params });

          const key = currentId === nextId ? route.key : `${route.name}-${nanoid()}`;

          const params = createParamsFromAction({ action, routeParamList });
          const newRoute = params !== route.params ? { ...route, key, params } : route;

          return {
            ...state,
            preloadedRouteKeys: state.preloadedRouteKeys
              .filter((key) => key !== route.key)
              .concat(newRoute.key),
            routes: state.routes.map((route, index) => (index === routeIndex ? newRoute : route)),
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

/**
 * TabRouter is considered an internal implementation and its behavior may change without a notice between expo-router's version
 */
export function TabRouter(
  args: TabRouterOptions
): Router<TabNavigationState<ParamListBase>, TabActionType | CommonNavigationAction> {
  const base = BaseTabRouter(args);
  return {
    ...base,
    getStateForAction: (state, action, options) => {
      if (action.target && action.target !== state.key) {
        return null;
      }

      if ((action.type as string) === 'REPLACE') {
        const replaceAction = action as unknown as Extract<StackActionType, { type: 'REPLACE' }>;
        const nextState = base.getStateForAction(
          state,
          {
            ...replaceAction,
            type: 'JUMP_TO',
          },
          options
        );

        if (nextState == null) {
          return null;
        }

        return pruneReplacedRoute(nextState as TabNavigationState<ParamListBase>);
      }

      return base.getStateForAction(state, action, options);
    },
  };
}
