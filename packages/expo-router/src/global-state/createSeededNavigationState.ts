import { sortRoutesWithInitial, type RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { getGroupMatchingRouteName } from '../layoutAnchor';
import { createInitialState } from '../react-navigation/core/createInitialState';
import type { NavigationState, PartialState } from '../react-navigation/routers';
import {
  createNavigatorStateKey,
  createRouteKeyMinter,
  getChainFromRouteKey,
  ROOT_CHAIN,
} from '../react-navigation/routers/stateKeys';
import { findRouteNodeByName, getValidInitialRouteName } from '../routeNode';
import { getRootStackRouteNames } from './utils';

type SeedState = NavigationState | PartialState<NavigationState>;
type SeedRoute = SeedState['routes'][number];

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
    anchorParams: undefined,
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
  parentChain: string,
  anchorParams?: object
): NavigationState {
  const initialRouteName = getValidInitialRouteName(routeNode);
  const routeNames = [...routeNode.children]
    .sort(sortRoutesWithInitial(initialRouteName))
    .map((child) => child.route);

  return createSeededState({
    targetState: withoutParsedGroupAnchor(
      targetState,
      getGroupMatchingRouteName(routeNode),
      initialRouteName
    ),
    routeNames,
    initialRouteName,
    anchorParams,
    parentChain,
    findChildNode: (routeName) => findRouteNodeByName(routeNode, routeName),
  });
}

/**
 * Removes the anchor that the URL parser added when `unstable_settings.anchor` picks another one.
 *
 * ```
 * (home)/
 *   _layout.tsx    // unstable_settings = { anchor: 'dashboard' }
 *   home.tsx       // Anchor added by the URL parser, because it is named like the group
 *   dashboard.tsx  // Anchor from settings
 *   details.tsx
 * ```
 *
 * The parser turns `/details` into `[home, details]`. This function returns `[details]`, and
 * `createSeededState` then adds `dashboard` to make `[dashboard, details]`.
 */
function withoutParsedGroupAnchor(
  state: SeedState | undefined,
  parsedAnchor: string | undefined,
  anchor: string | undefined
): SeedState | undefined {
  if (
    // Complete states do not come from the parser.
    !state ||
    state.stale === false ||
    parsedAnchor === anchor ||
    state.routes.length < 2 ||
    state.routes[0]!.name !== parsedAnchor ||
    state.index === 0
  ) {
    return state;
  }
  return {
    ...state,
    routes: state.routes.slice(1),
    index: state.index === undefined ? undefined : state.index - 1,
  };
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
  // The anchor route gets the path params of the route that owns this navigator.
  anchorParams: object | undefined;
  parentChain: string;
  // Root maps `INTERNAL_SLOT_NAME` to itself; nested levels lazily use `findRouteNodeByName`.
  findChildNode: (routeName: string) => RouteNode | undefined;
};

function createSeededState({
  targetState,
  routeNames,
  initialRouteName,
  anchorParams,
  parentChain,
  findChildNode,
}: CreateSeededStateOptions): NavigationState {
  const initialState = createInitialState({ routeNames: [], parentChain });
  let targetRoutes = targetState?.routes ?? [];

  const unknownRoute = targetRoutes.find((route) => !routeNames.includes(route.name));
  if (unknownRoute) {
    console.warn(
      `The initial navigation state contains the unknown route "${unknownRoute.name}". The route is not registered by its navigator, so Expo Router will use the navigator's initial route instead. Check that your linking configuration only returns registered routes.`
    );
    targetRoutes = [];
  }

  const routesToCreate = getRoutesToCreate(
    targetRoutes,
    routeNames,
    initialRouteName,
    anchorParams
  );
  const minter = createRouteKeyMinter(initialState);
  const routes = routesToCreate.map((targetRoute) => {
    const key = minter.mint(targetRoute.name);
    const childNode = findChildNode(targetRoute.name);
    const childState =
      childNode && childNode.children.length > 0
        ? createSeededNavigationState(
            'state' in targetRoute ? targetRoute.state : undefined,
            childNode,
            getChainFromRouteKey(key),
            'params' in targetRoute ? targetRoute.params : undefined
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

  let index = -1;
  if (targetRoutes.length > 0) {
    // The anchor added in front of the target routes moves the focused route by one.
    const addedAnchorCount = routes.length - targetRoutes.length;
    index = addedAnchorCount + (targetState?.index ?? targetRoutes.length - 1);
  } else if (routes.length > 0) {
    index = 0;
  }
  return {
    ...initialState,
    routeKeySeq: minter.routeKeySeq,
    routeNames,
    index,
    routes,
  };
}

/**
 * Returns the target routes with the anchor in front of them, so Back can return to the anchor.
 * Without target routes, returns only the anchor, or the first route when there is no anchor.
 */
function getRoutesToCreate(
  targetRoutes: SeedRoute[],
  routeNames: string[],
  initialRouteName: string | undefined,
  anchorParams: object | undefined
): SeedRoute[] {
  if (targetRoutes.length === 0) {
    const defaultRouteName = initialRouteName ?? routeNames[0];
    if (defaultRouteName === undefined) {
      return [];
    }
    return [{ name: defaultRouteName }];
  }
  if (initialRouteName && !targetRoutes.some((route) => route.name === initialRouteName)) {
    return [{ name: initialRouteName, params: anchorParams }, ...targetRoutes];
  }
  return targetRoutes;
}
