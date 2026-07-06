import { nanoid } from 'nanoid/non-secure';

import type { StackActionType } from '../core';
import { BaseRouter } from './BaseRouter';
import { createParamsFromAction } from './createParamsFromAction';
import { getNextRouteKeyFromState, getRouteKey } from './getRouteKey';
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
      // Internal: keep the implicit back-stack anchor materialized at the FRONT of the routes so
      // GO_BACK lands on it. Dispatched by `usePreloadAnchor`, not part of the public action helpers.
      type: 'FRONT_PRELOAD';
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

// A route's presence in `state.routes` is the loaded/preloaded signal, so `routes` is a subset of
// `routeNames`. Tab state is therefore just a plain NavigationState — no extra fields.
export type TabNavigationState<ParamList extends ParamListBase> = NavigationState<ParamList>;

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
  frontPreload(name: string, params?: object) {
    return {
      type: 'FRONT_PRELOAD',
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

// Reorders the routes that are PRESENT in `routes` (a subset of `routeNames`). The anchor route is
// assumed to already be present for the firstRoute/initialRoute behaviors — callers that may be
// missing it (getInitialState/getRehydratedState) add it first.
const arrangeBackStack = (
  routes: Route<string>[],
  focusedName: string,
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  routeNames: string[]
): { routes: Route<string>[]; index: number } => {
  const byName = (name: string) => routes.find((route) => route.name === name)!;
  // Present route names ordered by their declaration order.
  const presentNames = routeNames.filter((name) => routes.some((route) => route.name === name));

  if (backBehavior === 'order' || backBehavior === 'none') {
    return { routes: presentNames.map(byName), index: presentNames.indexOf(focusedName) };
  }

  const anchorName =
    backBehavior === 'initialRoute' &&
    initialRouteName !== undefined &&
    presentNames.includes(initialRouteName)
      ? initialRouteName
      : presentNames[0]!;

  const others = presentNames
    .filter((name) => name !== anchorName && name !== focusedName)
    .map(byName);

  if (focusedName === anchorName) {
    return { routes: [byName(anchorName), ...others], index: 0 };
  }

  return { routes: [byName(anchorName), byName(focusedName), ...others], index: 1 };
};

// The fresh-start subset: the focused route (from `initialRouteName`/declaration order) plus the
// back-stack anchor required by firstRoute/initialRoute. Shared by getInitialState and the
// empty-fallback paths of getRehydratedState / getStateForRouteNamesChange so all three agree on
// the focused route and ordering instead of hardcoding `routeNames[0]`.
const buildInitialSubset = (
  routeNames: string[],
  backBehavior: BackBehavior,
  initialRouteName: string | undefined,
  buildRoute: (name: string) => Route<string>
): { routes: Route<string>[]; index: number } => {
  const initialIndex =
    initialRouteName !== undefined && routeNames.includes(initialRouteName)
      ? routeNames.indexOf(initialRouteName)
      : 0;
  const focusedName = routeNames[initialIndex]!;

  // For firstRoute/initialRoute the back-stack anchor must exist too, so add it when distinct.
  const anchorName =
    backBehavior === 'firstRoute'
      ? routeNames[0]!
      : backBehavior === 'initialRoute'
        ? focusedName
        : undefined;

  const initialRoutes =
    anchorName !== undefined && anchorName !== focusedName
      ? [buildRoute(anchorName), buildRoute(focusedName)]
      : [buildRoute(focusedName)];

  if (backBehavior === 'history') {
    return { routes: initialRoutes, index: initialRoutes.findIndex((r) => r.name === focusedName) };
  }

  return arrangeBackStack(initialRoutes, focusedName, backBehavior, initialRouteName, routeNames);
};

/**
 * The back-stack anchor implied by `backBehavior` — the route GO_BACK ultimately lands on.
 * `getStateFromPath` only materializes anchors declared in the linking config
 * (`unstable_settings.anchor`), so tab navigators keep this implicit anchor loaded via
 * `usePreloadAnchor`, which front-preloads it (see the FRONT_PRELOAD case below).
 *
 * Must agree with `arrangeBackStack`/`buildInitialSubset`: `order`/`history`/`none` have no anchor;
 * `initialRoute` anchors on `initialRouteName` when declared, otherwise (like `firstRoute`) on the
 * first declared route — which is where the router's own back logic lands too.
 */
export function getBackStackAnchorName(
  routeNames: string[],
  backBehavior: BackBehavior = 'firstRoute',
  initialRouteName?: string
): string | undefined {
  if (backBehavior === 'order' || backBehavior === 'history' || backBehavior === 'none') {
    return undefined;
  }
  if (
    backBehavior === 'initialRoute' &&
    initialRouteName !== undefined &&
    routeNames.includes(initialRouteName)
  ) {
    return initialRouteName;
  }
  return routeNames[0];
}

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

    getInitialState({ routeNames, pathname, routeParamList }) {
      const buildRoute = (name: string) => ({
        name,
        key: getRouteKey(pathname, name),
        params: routeParamList[name],
      });

      // Presence is the loaded signal: materialize only the focused route (plus the firstRoute/
      // initialRoute anchor).
      const { routes, index } = buildInitialSubset(
        routeNames,
        backBehavior,
        initialRouteName,
        buildRoute
      );

      return {
        stale: false,
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        routes,
      };
    },

    getRehydratedState(partialState, { routeNames, pathname, routeParamList }) {
      const state = partialState;

      if (state.stale === false) {
        return state;
      }

      const partialRoutes = (state as PartialState<TabNavigationState<ParamListBase>>).routes;

      const buildRoute = (name: string, route: Route<string> | undefined) =>
        ({
          ...route,
          name,
          key: route && route.name === name && route.key ? route.key : getRouteKey(pathname, name),
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

      // Keep only the persisted subset whose names are still declared — presence is the loaded
      // signal, so undeclared-yet-absent routes are NOT materialized here.
      for (const route of partialRoutes) {
        if (routeNames.includes(route.name) && !seen.has(route.name)) {
          seen.add(route.name);
          rebuilt.push(buildRoute(route.name, route as Route<string>));
        }
      }

      // Nothing persisted survived: fall back to the fresh-start subset so the focused route and
      // anchor honor initialRouteName/back behavior (instead of hardcoding the first declared route).
      if (rebuilt.length === 0 && routeNames.length > 0) {
        const { routes, index } = buildInitialSubset(
          routeNames,
          backBehavior,
          initialRouteName,
          (name) => buildRoute(name, undefined)
        );
        return { stale: false, key: `tab-${nanoid()}`, index, routeNames, routes };
      }

      const persistedFocusedName = partialRoutes[state?.index ?? 0]?.name;
      const focusedName =
        persistedFocusedName !== undefined && seen.has(persistedFocusedName)
          ? persistedFocusedName
          : rebuilt[0]!.name;

      // firstRoute/initialRoute need the back-stack anchor present; add it if it wasn't persisted.
      const anchorName =
        backBehavior === 'firstRoute'
          ? routeNames[0]
          : backBehavior === 'initialRoute' &&
              initialRouteName !== undefined &&
              routeNames.includes(initialRouteName)
            ? initialRouteName
            : undefined;

      if (anchorName !== undefined && !seen.has(anchorName)) {
        seen.add(anchorName);
        rebuilt.push(buildRoute(anchorName, undefined));
      }

      const { routes, index } =
        backBehavior === 'history'
          ? { routes: rebuilt, index: rebuilt.findIndex((route) => route.name === focusedName) }
          : arrangeBackStack(rebuilt, focusedName, backBehavior, initialRouteName, routeNames);

      return {
        stale: false,
        key: `tab-${nanoid()}`,
        index,
        routeNames,
        routes,
      };
    },

    getStateForRouteNamesChange(state, { routeNames, pathname, routeParamList, routeKeyChanges }) {
      const seen = new Set<string>();
      const rebuilt: Route<string>[] = [];

      // Keep only the present routes whose names survived and whose key didn't change — presence is
      // the loaded signal, so newly-declared routes are NOT materialized here.
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

      // Nothing survived: fall back to the fresh-start subset so the focused route and anchor honor
      // initialRouteName/back behavior (instead of hardcoding the first declared route).
      if (rebuilt.length === 0 && routeNames.length > 0) {
        const { routes, index } = buildInitialSubset(
          routeNames,
          backBehavior,
          initialRouteName,
          (name) => ({ name, key: getRouteKey(pathname, name), params: routeParamList[name] })
        );
        return { ...state, routeNames, routes, index };
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

    getStateForAction(state, action, { routeNames, pathname, routeParamList, routeGetIdList }) {
      switch (action.type) {
        case 'JUMP_TO':
        case 'NAVIGATE':
        // @ts-expect-error PUSH is not part of tab actions
        case 'PUSH':
        case 'NAVIGATE_DEPRECATED': {
          // Only declared routes can be navigated to.
          if (!routeNames.includes(action.payload.name)) {
            return null;
          }

          const index = state.routes.findIndex((route) => route.name === action.payload.name);
          // Presence is the loaded signal: an absent route is created on navigate. Append it so it
          // sits at a known position; the back-stack arrangement below moves it into place.
          const existed = index !== -1;
          const route: Route<string> = existed
            ? state.routes[index]!
            : {
                name: action.payload.name,
                key: getNextRouteKeyFromState(pathname, action.payload.name, state),
                params: routeParamList[action.payload.name],
              };
          const fromIndex = existed ? index : state.routes.length;
          const currentRoutes = existed ? state.routes : [...state.routes, route];

          const getId = routeGetIdList[route.name];

          const currentId = getId?.({ params: route.params });
          const nextId = getId?.({ params: action.payload.params });

          // A changed id means a changed identity, so the route gets a fresh key (forcing a
          // remount) at the next free index past its current key.
          const key =
            currentId === nextId
              ? route.key
              : getNextRouteKeyFromState(pathname, route.name, state);

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

          if (existed && updatedRoute === route && index === state.index) {
            return state;
          }

          const { routes, index: newIndex } = focusRoute(
            currentRoutes,
            updatedRoute,
            fromIndex,
            state.index,
            backBehavior,
            initialRouteName,
            routeNames
          );

          return {
            ...state,
            routes,
            index: newIndex,
          };
        }

        case 'SET_PARAMS':
        case 'REPLACE_PARAMS':
          return BaseRouter.getStateForAction(state, action);

        case 'GO_BACK': {
          // Back walks the present routes by position only — never reorders.
          if (backBehavior === 'none' || state.index <= 0) {
            return null;
          }

          return {
            ...state,
            index: state.index - 1,
          };
        }

        case 'PRELOAD': {
          // Only declared routes can be preloaded.
          if (!routeNames.includes(action.payload.name)) {
            return null;
          }

          const routeIndex = state.routes.findIndex((route) => route.name === action.payload.name);

          // Absent route: insert it (presence is the preloaded signal) without changing focus.
          if (routeIndex === -1) {
            const params = createParamsFromAction({ action, routeParamList });
            const newRoute: Route<string> = {
              name: action.payload.name,
              key: getNextRouteKeyFromState(pathname, action.payload.name, state),
              params,
            };

            return {
              ...state,
              routes: [...state.routes, newRoute],
            };
          }

          // Already present: refresh its params/key in place, leaving focus untouched.
          const route = state.routes[routeIndex]!;

          const getId = routeGetIdList[route.name];

          const currentId = getId?.({ params: route.params });
          const nextId = getId?.({ params: action.payload.params });

          // A changed id means a changed identity, so the route gets a fresh key (forcing a
          // remount) at the next free index past its current key.
          const key =
            currentId === nextId
              ? route.key
              : getNextRouteKeyFromState(pathname, route.name, state);

          const params = createParamsFromAction({ action, routeParamList });
          const newRoute = params !== route.params ? { ...route, key, params } : route;

          if (newRoute === route) {
            return state;
          }

          return {
            ...state,
            routes: state.routes.map((r, index) => (index === routeIndex ? newRoute : r)),
          };
        }

        case 'FRONT_PRELOAD': {
          if (!routeNames.includes(action.payload.name)) {
            return null;
          }

          if (backBehavior !== 'firstRoute' && backBehavior !== 'initialRoute') {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                `Ignored a FRONT_PRELOAD action for "${action.payload.name}" because the navigator's backBehavior is "${backBehavior}", which has no implicit back-stack anchor. FRONT_PRELOAD only applies to "firstRoute" and "initialRoute". Use PRELOAD to load a route without changing the back stack, or remove the FRONT_PRELOAD dispatch for this navigator.`
              );
            }
            return state;
          }

          // Never reorder live history: if the anchor is already present anywhere, leave it be.
          if (state.routes.some((route) => route.name === action.payload.name)) {
            return state;
          }

          const params = createParamsFromAction({ action, routeParamList });
          const newRoute: Route<string> = {
            name: action.payload.name,
            key: getNextRouteKeyFromState(pathname, action.payload.name, state),
            params,
          };

          return {
            ...state,
            routes: [newRoute, ...state.routes],
            index: state.index + 1,
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
