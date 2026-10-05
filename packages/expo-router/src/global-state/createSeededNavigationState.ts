import { findRouteNodeByName, sortRoutes, type RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { matchDynamicName, removeSupportedExtensions } from '../matchers';
import { createInitialState } from '../react-navigation/core/createInitialState';
import { deepFreeze } from '../react-navigation/core/deepFreeze';
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
 * Tells a navigator how to apply its anchor when it mounts. State built before mount cannot read
 * the anchor, because the layout module may not be loaded yet.
 * - `default`: no explicit destination was supplied. The anchor becomes the navigator's default
 *   route and replaces the temporary fallback route.
 * - `target`: an explicit destination was supplied. It stays active and the anchor is inserted
 *   underneath it, with `params` when given.
 *
 * For example:
 *
 * ```
 * app/
 *   _layout.tsx            anchor: '(shop)'
 *   product/[id].tsx       presented as a modal
 *   (shop)/
 *     _layout.tsx          anchor: 'catalog'
 *     index.tsx
 *     catalog.tsx
 * ```
 *
 * Opening `/product/1` seeds the root navigator with `product/[id]` and marks it `target`. When the
 * root layout mounts, `(shop)` is inserted under the modal, so dismissing it shows the shop. The
 * inserted `(shop)` route has no destination, so its navigator starts at the first route in file
 * order, marked `default`. When `(shop)/_layout.tsx` mounts, `catalog` replaces that route.
 *
 * Opening `/` targets `(shop)/index`. The root navigator already contains its anchor `(shop)`, so
 * it is unchanged. The `(shop)` navigator is marked `target`, so `catalog` is inserted under
 * `index`.
 */
export type PendingAnchor = { type: 'default' } | { type: 'target'; params?: object };

type WithPendingAnchor<State extends NavigationState> = State & {
  __internal__pendingAnchor?: PendingAnchor;
};

export function withPendingAnchor<State extends NavigationState>(
  state: State,
  pendingAnchor: PendingAnchor
): WithPendingAnchor<State> {
  return { ...state, __internal__pendingAnchor: pendingAnchor };
}

/**
 * Removes pending anchor markers from a complete state tree. Unchanged branches keep their
 * identity.
 */
export function stripPendingAnchors<State extends NavigationState>(state: State): State {
  let routesChanged = false;
  const routes = state.routes.map((route) => {
    if (route.state?.stale !== false) {
      return route;
    }
    // `stale: false` marks a complete nested state.
    const childState = stripPendingAnchors(route.state as NavigationState);
    if (childState === route.state) {
      return route;
    }
    routesChanged = true;
    return { ...route, state: childState };
  });
  // `NavigationState` does not declare the internal marker.
  const { __internal__pendingAnchor, ...rest } = state as WithPendingAnchor<State>;
  if (__internal__pendingAnchor === undefined && !routesChanged) {
    return state;
  }
  // Removing the marker keeps every field of `State`.
  return deepFreeze({ ...rest, routes } as unknown as State);
}

/**
 * Applies the pending anchor of a mounted navigator and removes the marker. The result depends
 * only on its arguments, so render and the store produce the same route keys.
 */
export function resolvePendingAnchor<State extends NavigationState>(
  state: State,
  routeNode: RouteNode | null,
  anchor: string | undefined
): State {
  // `NavigationState` does not declare the internal marker.
  const { __internal__pendingAnchor: pendingAnchor, ...rest } = state as WithPendingAnchor<State>;
  if (!pendingAnchor) {
    return state;
  }
  // Removing the marker keeps every field of `State`.
  const unmarked = rest as unknown as State;
  if (
    !anchor ||
    state.routes.length > 1 ||
    !state.routeNames.includes(anchor) ||
    state.routes.some((route) => route.name === anchor)
  ) {
    return unmarked;
  }

  const minter = createRouteKeyMinter(state);
  const key = minter.mint(anchor);
  const childNode = findRouteNodeByName(routeNode, anchor);
  const anchorRoute = {
    key,
    name: anchor,
    ...(pendingAnchor.type === 'target' && pendingAnchor.params
      ? { params: pendingAnchor.params }
      : undefined),
    // A layout anchor needs its own seeded state, because its navigator renders right away. That
    // state applies the layout's own anchor when it mounts.
    ...(childNode && childNode.children.length > 0
      ? { state: createSeededNavigationState(undefined, childNode, getChainFromRouteKey(key)) }
      : undefined),
  };
  if (pendingAnchor.type === 'default') {
    return { ...unmarked, routeKeySeq: minter.routeKeySeq, index: 0, routes: [anchorRoute] };
  }
  return {
    ...unmarked,
    routeKeySeq: minter.routeKeySeq,
    index: 1,
    routes: [anchorRoute, state.routes[0]!],
  };
}

/**
 * Completes the partial state parsed from the initial URL by `getStateFromPath` with keys,
 * route names, pending anchors, and `stale: false` so navigators can adopt it directly.
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
  const state = createSeededState({
    targetState,
    routeNames: getRouteNames(routeNode),
    parentChain,
    findChildNode: (routeName) => findRouteNodeByName(routeNode, routeName),
  });
  const targetRoute = targetState?.routes[targetState.index ?? targetState.routes.length - 1];
  if (!targetRoute || !state.routes.some((route) => route.name === targetRoute.name)) {
    return withPendingAnchor(state, { type: 'default' });
  }
  const params = getPathParams(
    findRouteNodeByName(routeNode, targetRoute.name),
    targetRoute.params
  );
  return withPendingAnchor(state, { type: 'target', ...(params ? { params } : undefined) });
}

/**
 * Returns the params of a route that come from its path, like `id` for `[id].tsx`. The anchor of a
 * URL target gets them, while query params stay on the target.
 */
function getPathParams(node: RouteNode | undefined, params: object | undefined) {
  if (!node || !params) {
    return undefined;
  }
  const names = new Set(
    removeSupportedExtensions(node.contextKey)
      .split('/')
      .map((segment) => matchDynamicName(segment)?.name)
  );
  const pathParams = Object.fromEntries(Object.entries(params).filter(([name]) => names.has(name)));
  return Object.keys(pathParams).length > 0 ? pathParams : undefined;
}

/** Returns the route names in file order. Mounted navigators move the anchor first. */
export function getRouteNames(routeNode: RouteNode): string[] {
  return [...routeNode.children].sort(sortRoutes).map((child) => child.route);
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

    const childState = route.state
      ? completeExistingState(
          route.state,
          getRouteNames(childNode),
          getChainFromRouteKey(routeKey),
          (routeName) => findRouteNodeByName(childNode, routeName)
        )
      : // A route opened without a nested destination, like a tab press, shows the same screen as
        // its URL. The anchor is not applied, because it only adds a back destination for URLs.
        createSeededState({
          targetState: undefined,
          routeNames: getRouteNames(childNode),
          parentChain: getChainFromRouteKey(routeKey),
          findChildNode: (routeName) => findRouteNodeByName(childNode, routeName),
        });

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
  parentChain: string;
  // Root maps `INTERNAL_SLOT_NAME` to itself; nested levels lazily use `findRouteNodeByName`.
  findChildNode: (routeName: string) => RouteNode | undefined;
};

function createSeededState({
  targetState,
  routeNames,
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

  const defaultRouteName = routeNames[0];
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
    index: routes.length === 0 ? -1 : targetIndex,
    routes,
  };
}
