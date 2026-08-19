import { nanoid } from 'nanoid/non-secure';

import {
  findRouteNodeByName,
  getValidInitialRouteName,
  sortRoutesWithInitial,
  type RouteNode,
} from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { createInitialState } from '../react-navigation/core/createInitialState';
import type { NavigationState, PartialState } from '../react-navigation/routers';
import { getRootStackRouteNames } from './utils';

type SeedState = NavigationState | PartialState<NavigationState>;

/**
 * Completes the partial state parsed from the initial URL by `getStateFromPath` with keys,
 * route names, anchor routes, and `stale: false` so navigators can adopt it directly.
 *
 * @param targetState The partial state the app should start in, parsed from the initial URL by
 * `getStateFromPath`.
 * @param rootRouteNode The root of the app's route tree.
 */
export function createSeededRootState(
  targetState: ResultState | undefined,
  rootRouteNode: RouteNode
): NavigationState {
  return createSeededState({
    targetState,
    routeNames: getRootStackRouteNames(),
    initialRouteName: undefined,
    targetInitialRouteName: undefined,
    findChildNode: (routeName) => (routeName === INTERNAL_SLOT_NAME ? rootRouteNode : undefined),
  });
}

export function completeNavigationState(
  state: SeedState,
  rootRouteNode: RouteNode
): NavigationState {
  return completeExistingState(state, getRootStackRouteNames(), (routeName) =>
    routeName === INTERNAL_SLOT_NAME ? rootRouteNode : undefined
  );
}

export function completeParsedState(
  targetState: SeedState | undefined
): NavigationState | undefined {
  if (!targetState) {
    return undefined;
  }

  const routes = targetState.routes.map((route) => ({
    ...route,
    key: route.key ?? `${route.name}-${nanoid()}`,
    ...(route.state ? { state: completeParsedState(route.state) } : undefined),
  }));

  return {
    ...targetState,
    stale: false,
    key: targetState.key ?? `navigator-${nanoid()}`,
    index: targetState.index ?? routes.length - 1,
    routeNames: targetState.routeNames ?? [...new Set(routes.map((route) => route.name))],
    routes,
  };
}

export function createSeededNavigationState(
  targetState: SeedState | undefined,
  routeNode: RouteNode
): NavigationState {
  const initialRouteName = getValidInitialRouteName(routeNode);
  const routeNames = [...routeNode.children]
    .sort(sortRoutesWithInitial(initialRouteName))
    .map((child) => child.route);

  return createSeededState({
    targetState,
    routeNames,
    initialRouteName,
    targetInitialRouteName: routeNode.initialRouteName,
    findChildNode: (routeName) => findRouteNodeByName(routeNode, routeName),
  });
}

// TODO(@ubax): consider replacing findChildNode here and in other places
// by passing the node directly
function completeExistingState(
  state: SeedState,
  fallbackRouteNames: string[],
  findChildNode: (routeName: string) => RouteNode | undefined
): NavigationState {
  let routesChanged = false;
  const routes = state.routes.map((route) => {
    const childNode = findChildNode(route.name);
    const routeKey = route.key ?? `${route.name}-${nanoid()}`;
    // `PartialState` keeps the route union partial after the key check, but this branch proves it is complete.
    const completeRoute: NavigationState['routes'][number] =
      route.key === undefined
        ? { ...route, key: routeKey }
        : (route as NavigationState['routes'][number]);
    if (route.key === undefined) {
      routesChanged = true;
    }
    if (!childNode || childNode.children.length === 0) {
      return completeRoute;
    }

    const initialRouteName = getValidInitialRouteName(childNode);
    const childRouteNames = [...childNode.children]
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((child) => child.route);
    const childState = route.state
      ? completeExistingState(route.state, childRouteNames, (routeName) =>
          findRouteNodeByName(childNode, routeName)
        )
      : createSeededNavigationState(undefined, childNode);

    if (childState === route.state && routeKey === route.key) {
      return completeRoute;
    }

    routesChanged = true;
    return { ...completeRoute, state: childState };
  });

  if (
    !routesChanged &&
    state.stale === false &&
    state.key !== undefined &&
    state.index !== undefined &&
    state.routeNames !== undefined
  ) {
    return state as NavigationState;
  }

  return {
    ...state,
    stale: false,
    key: state.key ?? `navigator-${nanoid()}`,
    index: state.index ?? Math.max(routes.length - 1, 0),
    routeNames: state.routeNames ?? fallbackRouteNames,
    routes,
  };
}

type CreateSeededStateOptions = {
  targetState: SeedState | undefined;
  routeNames: string[];
  initialRouteName: string | undefined;
  targetInitialRouteName: string | undefined;
  // Root maps `INTERNAL_SLOT_NAME` to itself; nested levels lazily use `findRouteNodeByName`.
  findChildNode: (routeName: string) => RouteNode | undefined;
};

function createSeededState({
  targetState,
  routeNames,
  initialRouteName,
  targetInitialRouteName,
  findChildNode,
}: CreateSeededStateOptions): NavigationState {
  const initialState = createInitialState({ routeNames, initialRouteName });
  const parsedRoutes = targetState?.routes ?? [];
  const targetInitialRouteIndex = parsedRoutes.findIndex(
    (route) => route.name === targetInitialRouteName
  );
  const omitTargetInitialRoute =
    initialRouteName !== targetInitialRouteName &&
    parsedRoutes.some((route) => route.name === initialRouteName);
  const targetRoutes = parsedRoutes.flatMap((route, index) => {
    if (omitTargetInitialRoute && index === targetInitialRouteIndex) {
      return [];
    }
    return initialRouteName && route.name === targetInitialRouteName
      ? [{ ...route, name: initialRouteName }]
      : [route];
  });

  for (const targetRoute of targetRoutes) {
    if (!routeNames.includes(targetRoute.name)) {
      throw new Error(
        `The initial navigation state contains the unknown route "${targetRoute.name}". The route is not registered by its navigator. This is likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
      );
    }
  }

  const routes = targetRoutes.map((targetRoute) => {
    const childNode = findChildNode(targetRoute.name);
    const childState =
      childNode && childNode.children.length > 0
        ? createSeededNavigationState(targetRoute.state, childNode)
        : undefined;

    return {
      key: `${targetRoute.name}-${nanoid()}`,
      name: targetRoute.name,
      ...('path' in targetRoute ? { path: targetRoute.path } : undefined),
      ...('params' in targetRoute ? { params: targetRoute.params } : undefined),
      ...(childState ? { state: childState } : undefined),
    };
  });

  if (routes.length === 0) {
    return initialState;
  }

  const targetIndex = targetState?.index ?? routes.length - 1;
  return {
    ...initialState,
    index:
      omitTargetInitialRoute && targetInitialRouteIndex <= targetIndex
        ? targetIndex - 1
        : targetIndex,
    routes,
  };
}
