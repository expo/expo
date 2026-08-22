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
import {
  createNavigatorStateKey,
  createRouteKeyMinter,
  getChainFromRouteKey,
  ROOT_CHAIN,
} from '../react-navigation/routers/stateKeys';
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
    parentChain: ROOT_CHAIN,
    findChildNode: (routeName) => (routeName === INTERNAL_SLOT_NAME ? rootRouteNode : undefined),
  });
}

export function completeNavigationState(
  state: SeedState,
  rootRouteNode: RouteNode
): NavigationState {
  return completeExistingState(state, getRootStackRouteNames(), ROOT_CHAIN, (routeName) =>
    routeName === INTERNAL_SLOT_NAME ? rootRouteNode : undefined
  );
}

export function completeParsedState(
  targetState: SeedState | undefined,
  parentChain: string
): NavigationState | undefined {
  if (!targetState) {
    return undefined;
  }

  const key = targetState.key ?? createNavigatorStateKey(parentChain);
  const minter = createRouteKeyMinter({ key, routeKeySeq: targetState.routeKeySeq ?? 0 });
  const routes = targetState.routes.map((route) => {
    const routeKey = route.key ?? minter.mint(route.name);
    return {
      ...route,
      key: routeKey,
      ...(route.state
        ? { state: completeParsedState(route.state, getChainFromRouteKey(routeKey)) }
        : undefined),
    };
  });

  return {
    ...targetState,
    stale: false,
    key,
    routeKeySeq: minter.routeKeySeq,
    index: targetState.index ?? routes.length - 1,
    routeNames: targetState.routeNames ?? [...new Set(routes.map((route) => route.name))],
    routes,
  };
}

export function createSeededNavigationState(
  targetState: SeedState | undefined,
  routeNode: RouteNode,
  parentChain: string
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
    parentChain,
    findChildNode: (routeName) => findRouteNodeByName(routeNode, routeName),
  });
}

// TODO(@ubax): consider replacing findChildNode here and in other places
// by passing the node directly
function completeExistingState(
  state: SeedState,
  fallbackRouteNames: string[],
  parentChain: string,
  findChildNode: (routeName: string) => RouteNode | undefined
): NavigationState {
  const key = state.key ?? createNavigatorStateKey(parentChain);
  const minter = createRouteKeyMinter({ key, routeKeySeq: state.routeKeySeq ?? 0 });
  let routesChanged = false;
  const routes = state.routes.map((route) => {
    const childNode = findChildNode(route.name);
    const routeKey = route.key ?? minter.mint(route.name);
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
      ? completeExistingState(
          route.state,
          childRouteNames,
          getChainFromRouteKey(routeKey),
          (routeName) => findRouteNodeByName(childNode, routeName)
        )
      : createSeededNavigationState(undefined, childNode, getChainFromRouteKey(routeKey));

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
    state.routeKeySeq === minter.routeKeySeq &&
    state.index !== undefined &&
    state.routeNames !== undefined
  ) {
    return state as NavigationState;
  }

  return {
    ...state,
    stale: false,
    key,
    routeKeySeq: minter.routeKeySeq,
    index: state.index ?? routes.length - 1,
    routeNames: state.routeNames ?? fallbackRouteNames,
    routes,
  };
}

type CreateSeededStateOptions = {
  targetState: SeedState | undefined;
  routeNames: string[];
  initialRouteName: string | undefined;
  targetInitialRouteName: string | undefined;
  parentChain: string;
  // Root maps `INTERNAL_SLOT_NAME` to itself; nested levels lazily use `findRouteNodeByName`.
  findChildNode: (routeName: string) => RouteNode | undefined;
};

function createSeededState({
  targetState,
  routeNames,
  initialRouteName,
  targetInitialRouteName,
  parentChain,
  findChildNode,
}: CreateSeededStateOptions): NavigationState {
  const initialState = createInitialState({ routeNames: [], parentChain });
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

  const defaultRouteName = initialRouteName ?? routeNames[0];
  const routesToCreate =
    targetRoutes.length > 0
      ? targetRoutes
      : defaultRouteName === undefined
        ? []
        : [{ name: defaultRouteName }];
  const minter = createRouteKeyMinter(initialState);
  const routes = routesToCreate.map((targetRoute) => {
    const key = minter.mint(targetRoute.name);
    const childNode = findChildNode(targetRoute.name);
    const childState =
      childNode && childNode.children.length > 0
        ? createSeededNavigationState(
            'state' in targetRoute ? targetRoute.state : undefined,
            childNode,
            getChainFromRouteKey(key)
          )
        : undefined;

    return {
      key,
      name: targetRoute.name,
      ...('path' in targetRoute ? { path: targetRoute.path } : undefined),
      ...('params' in targetRoute ? { params: targetRoute.params } : undefined),
      ...(childState ? { state: childState } : undefined),
    };
  });

  const targetIndex = targetRoutes.length > 0 ? (targetState?.index ?? routes.length - 1) : 0;
  return {
    ...initialState,
    routeKeySeq: minter.routeKeySeq,
    routeNames,
    index:
      routes.length === 0
        ? -1
        : omitTargetInitialRoute && targetInitialRouteIndex <= targetIndex
          ? targetIndex - 1
          : targetIndex,
    routes,
  };
}
