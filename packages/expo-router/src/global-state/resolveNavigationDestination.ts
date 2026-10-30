import isEqual from 'react-fast-compare';

import type { RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { matchDynamicName } from '../matchers';
import { appendInternalExpoRouterParams, type InternalExpoRouterParams } from '../navigationParams';
import { createInitialState } from '../react-navigation/core/createInitialState';
import type {
  NavigationAction,
  NavigationState,
  PartialRoute,
  PartialState,
  Route,
} from '../react-navigation/routers';
import type { RouteState } from '../react-navigation/routers/attachRouteState';
import { createRouteKeyMinter, getChainFromRouteKey } from '../react-navigation/routers/stateKeys';
import { isActionHandled } from '../react-navigation/routers/utils';
import { findRouteNodeByName, getValidInitialRouteName } from '../routeNode';
import { sortRoutesWithInitial } from '../sortRoutes';
import { getSingularId } from '../utils/getSingularId';
import type { RouterRegistry, RouterRegistryEntry } from './routerRegistry';

type DestinationAction = NavigationAction & {
  payload: {
    __internal__PreviewKey?: string;
    name?: string;
    params?: object;
    path?: string;
    state?: RouteState;
    [key: string]: unknown;
  };
};

type Options = {
  targetState: ResultState;
  navigationState: NavigationState;
  routeNode: RouteNode;
  registry: RouterRegistry;
  action: DestinationAction;
  withAnchor?: boolean;
  internalParams?: InternalExpoRouterParams;
};

const supportedActionTypes = new Set([
  'NAVIGATE',
  'PUSH',
  'REPLACE',
  'POP_TO',
  'PRELOAD',
  'JUMP_TO',
]);

export function resolveNavigationDestination({
  targetState,
  navigationState,
  routeNode,
  registry,
  action,
  withAnchor = false,
  internalParams = {},
}: Options): DestinationAction {
  if (!supportedActionTypes.has(action.type)) {
    throw new Error(`Unsupported destination action type: ${action.type}`);
  }

  let target = targetState;
  let current = navigationState;
  let node = routeNode;
  let descended = false;

  while (true) {
    const targetRoute = getFocusedRoute(target);
    const currentRoute =
      current.type === 'tab' && action.type === 'PRELOAD'
        ? current.routes.find((route) => route.name === targetRoute?.name)
        : current.routes[current.index];
    const childNode = findDestinationNode(node, targetRoute?.name);
    const childTarget = targetRoute?.state;
    const childState = currentRoute?.state;

    if (
      !targetRoute ||
      !childNode ||
      !currentRoute ||
      !routesMatch(targetRoute, currentRoute) ||
      !childTarget ||
      childState?.stale !== false ||
      !registry.has(childState.key)
    ) {
      break;
    }

    const childRoute = getFocusedRoute(childTarget);
    if (!childRoute) {
      break;
    }
    const probeAction: NavigationAction = {
      type: 'NAVIGATE',
      payload: {
        name: childRoute.name,
        params: appendInternalExpoRouterParams(childRoute.params, internalParams),
      },
    };
    if (getSelection(registry.get(childState.key)?.reduce(childState, probeAction)) === undefined) {
      break;
    }

    target = childTarget as ResultState;
    current = childState;
    node = childNode;
    descended = true;
  }

  const resolvedAction = { ...action, target: current.key };
  if (descended) {
    delete resolvedAction.source;
  }

  return createResolvedAction({
    targetState: target,
    navigationState: current,
    routeNode: node,
    rootRouteNode: routeNode,
    registry,
    action: resolvedAction,
    withAnchor,
    internalParams,
  });
}

function createResolvedAction({
  targetState,
  navigationState,
  routeNode,
  rootRouteNode,
  registry,
  action,
  withAnchor = false,
  internalParams = {},
}: Omit<Options, 'action'> & {
  action: DestinationAction;
  rootRouteNode: RouteNode;
}): DestinationAction {
  const targetRoute = getFocusedRoute(targetState);
  if (!targetRoute) {
    return action;
  }

  const params = appendInternalExpoRouterParams(targetRoute.params, internalParams) ?? {};
  const childTarget = targetRoute.state;
  const childNode = findDestinationNode(routeNode, targetRoute.name);
  const { pop, ...actionPayload } = action.payload;
  const shouldPop =
    pop === true &&
    shouldPopTo({ targetRoute, navigationState, routeNode, rootRouteNode, childNode });
  const payload = {
    ...actionPayload,
    ...(shouldPop ? { pop } : undefined),
    name: targetRoute.name,
    params,
    ...(targetRoute.path !== undefined ? { path: targetRoute.path } : undefined),
  };
  const baseAction = { ...action, payload };
  const result = registry.get(navigationState.key)?.reduce(navigationState, baseAction);
  const selectedRoute = getSelection(result)?.route;

  if (!childTarget || !childNode) {
    return baseAction;
  }

  // Resolution and dispatch reduce the same state, so speculative minting produces the same key.
  const parentChain = getChainFromRouteKey(
    selectedRoute?.key ?? createRouteKeyMinter(navigationState).mint(targetRoute.name)
  );
  const childState = resolveState({
    targetState: childTarget,
    navigationState: selectedRoute?.state,
    routeNode: childNode,
    rootRouteNode,
    registry,
    withAnchor,
    internalParams,
    parentChain,
    previewKey: action.payload.__internal__PreviewKey,
    // Navigators below the `POP_TO` target get `NAVIGATE`, which pushes unless `pop` is set.
    pop: pop === true || action.type === 'POP_TO',
  });

  return {
    ...baseAction,
    payload: {
      ...payload,
      state: markState(childState),
    },
  };
}

function resolveState({
  targetState,
  navigationState,
  routeNode,
  rootRouteNode,
  registry,
  withAnchor,
  internalParams,
  parentChain,
  previewKey,
  pop,
}: {
  targetState: PartialState<NavigationState>;
  navigationState: NavigationState | PartialState<NavigationState> | undefined;
  routeNode: RouteNode;
  rootRouteNode: RouteNode;
  registry: RouterRegistry;
  withAnchor: boolean;
  internalParams: InternalExpoRouterParams;
  parentChain: string;
  previewKey?: string;
  /** Requested for every level; createResolvedAction decides per level (see shouldPopTo). */
  pop?: boolean;
}): NavigationState {
  if (navigationState?.stale !== false || !registry.has(navigationState.key)) {
    return createDestinationState(targetState, routeNode, withAnchor, internalParams, parentChain);
  }

  const targetRoute = getFocusedRoute(targetState);
  if (!targetRoute) {
    return navigationState;
  }

  const action = createResolvedAction({
    targetState: targetState as ResultState,
    navigationState,
    routeNode,
    rootRouteNode,
    registry,
    action: {
      type: 'NAVIGATE',
      payload: { __internal__PreviewKey: previewKey, ...(pop ? { pop } : undefined) },
    },
    withAnchor,
    internalParams,
  });
  const result = registry.get(navigationState.key)?.reduce(navigationState, action);
  const selection = getSelection(result);
  if (!selection) {
    return createDestinationState(targetState, routeNode, withAnchor, internalParams, parentChain);
  }

  return isEqual(selection.state, navigationState) ? navigationState : selection.state;
}

function createDestinationState(
  targetState: PartialState<NavigationState>,
  routeNode: RouteNode,
  withAnchor: boolean,
  internalParams: InternalExpoRouterParams,
  parentChain: string
): NavigationState {
  const targetRoute = getFocusedRoute(targetState);
  const initialRouteName = getValidInitialRouteName(routeNode);
  // Sort like a mounted navigator does, so the route names match on mount and no
  // ROUTE_NAMES_CHANGED action is queued.
  const routeNames = [...routeNode.children]
    .sort(sortRoutesWithInitial(initialRouteName))
    .map((child) => child.route);
  if (!targetRoute) {
    return markState(
      createInitialState({
        routeNames,
        initialRouteName,
        parentChain,
      })
    );
  }
  if (!routeNames.includes(targetRoute.name)) {
    console.warn(
      `The navigation destination contains the unknown route "${targetRoute.name}". The route is not registered by its navigator, so Expo Router will use the navigator's initial route instead. Check that your linking configuration only returns registered routes.`
    );
    return markState(
      createInitialState({
        routeNames,
        initialRouteName,
        parentChain,
      })
    );
  }

  const hasAnchor = withAnchor && initialRouteName && initialRouteName !== targetRoute.name;
  const destination = createInitialState({
    routeNames,
    initialRouteName: hasAnchor ? initialRouteName : targetRoute.name,
    parentChain,
  });
  const minter = createRouteKeyMinter(destination);
  const destinationRouteKey = hasAnchor
    ? minter.mint(targetRoute.name)
    : destination.routes[0]!.key;
  const childNode = findRouteNodeByName(routeNode, targetRoute.name);
  const childState =
    targetRoute.state && childNode
      ? createDestinationState(
          targetRoute.state,
          childNode,
          withAnchor,
          internalParams,
          getChainFromRouteKey(destinationRouteKey)
        )
      : undefined;
  const destinationRoute = {
    ...destination.routes[0]!,
    key: destinationRouteKey,
    name: targetRoute.name,
    ...(targetRoute.path !== undefined ? { path: targetRoute.path } : undefined),
    params: appendInternalExpoRouterParams(targetRoute.params, internalParams) ?? {},
    ...(childState !== undefined ? { state: childState } : undefined),
  };
  if (hasAnchor) {
    return markState({
      ...destination,
      routeKeySeq: minter.routeKeySeq,
      index: 1,
      routes: [destination.routes[0]!, destinationRoute],
    });
  }

  return markState({ ...destination, routes: [destinationRoute] });
}

function getFocusedRoute(
  state: PartialState<NavigationState>
): PartialRoute<Route<string>> | undefined {
  return state.routes[state.index ?? state.routes.length - 1];
}

function routesMatch(
  targetRoute: PartialRoute<Route<string>>,
  currentRoute: Route<string> & {
    state?: NavigationState | PartialState<NavigationState>;
  }
) {
  if (targetRoute.name !== currentRoute.name) {
    return false;
  }

  const dynamic = matchDynamicName(targetRoute.name);
  return (
    !dynamic ||
    (targetRoute.params as Record<string, unknown> | undefined)?.[dynamic.name] ===
      (currentRoute.params as Record<string, unknown> | undefined)?.[dynamic.name]
  );
}

/**
 * Whether a `pop` request should apply to the target in this navigator. This follows React
 * Navigation's `getActionFromState`, which incoming links used before: the root layout's navigator
 * pops only to a route that holds a navigator, and every navigator below it pops to the target
 * screen too. Stacks pop to the last route with the target's name, so for a dynamic route that
 * route must also have the target's params; otherwise the link pushes a new instance instead of
 * taking over another one.
 */
function shouldPopTo({
  targetRoute,
  navigationState,
  routeNode,
  rootRouteNode,
  childNode,
}: {
  targetRoute: PartialRoute<Route<string>>;
  navigationState: NavigationState;
  routeNode: RouteNode;
  rootRouteNode: RouteNode;
  childNode: RouteNode | null | undefined;
}) {
  const isRootLayoutNavigator =
    routeNode === rootRouteNode && targetRoute.name !== INTERNAL_SLOT_NAME;
  const holdsNavigator = targetRoute.state !== undefined || (childNode?.children.length ?? 0) > 0;
  if (isRootLayoutNavigator && !holdsNavigator) {
    return false;
  }
  const popTarget = navigationState.routes.findLast((route) => route.name === targetRoute.name);
  return (
    !popTarget ||
    getSingularId(targetRoute.name, { params: targetRoute.params }) ===
      getSingularId(popTarget.name, { params: popTarget.params })
  );
}

function findDestinationNode(routeNode: RouteNode, routeName: string | undefined) {
  return routeName === INTERNAL_SLOT_NAME ? routeNode : findRouteNodeByName(routeNode, routeName);
}

function getSelection(result: ReturnType<RouterRegistryEntry['reduce']> | undefined) {
  if (
    result === undefined ||
    !isActionHandled(result) ||
    result.state.stale !== false ||
    result.affectedRouteKey === undefined
  ) {
    return undefined;
  }
  const route = result.state.routes.find((route) => route.key === result.affectedRouteKey);
  return route && { state: result.state, route };
}

function markState<T extends NavigationState>(state: T): T & RouteState {
  return { ...state, __internal__routerActionState: true };
}

// TODO: Move removal-protection registrations into a global registry so resolved trees can run
// checks for route keys they remove before dispatch.
