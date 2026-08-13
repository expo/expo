import isEqual from 'fast-deep-equal';

import { findRouteNodeByName, getValidInitialRouteName, type RouteNode } from '../Route';
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
import type { RouterRegistry } from './routerRegistry';

type DestinationAction = NavigationAction & {
  payload: {
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
    if (
      getSelectedRoute(registry.get(childState.key)?.reduce(childState, probeAction)) === undefined
    ) {
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
  registry,
  action,
  withAnchor = false,
  internalParams = {},
}: Omit<Options, 'action'> & { action: DestinationAction }): DestinationAction {
  const targetRoute = getFocusedRoute(targetState);
  if (!targetRoute) {
    return action;
  }

  const params = appendInternalExpoRouterParams(targetRoute.params, internalParams) ?? {};
  const payload = {
    ...action.payload,
    name: targetRoute.name,
    params,
    ...(targetRoute.path !== undefined ? { path: targetRoute.path } : undefined),
  };
  const baseAction = { ...action, payload };
  const result = registry.get(navigationState.key)?.reduce(navigationState, baseAction);
  const selectedRoute = getSelectedRoute(result);
  const childTarget = targetRoute.state;
  const childNode = findDestinationNode(routeNode, targetRoute.name);

  if (!childTarget || !childNode) {
    return baseAction;
  }

  const childState = resolveState({
    targetState: childTarget,
    navigationState: selectedRoute?.state,
    routeNode: childNode,
    registry,
    withAnchor,
    internalParams,
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
  registry,
  withAnchor,
  internalParams,
}: {
  targetState: PartialState<NavigationState>;
  navigationState: NavigationState | PartialState<NavigationState> | undefined;
  routeNode: RouteNode;
  registry: RouterRegistry;
  withAnchor: boolean;
  internalParams: InternalExpoRouterParams;
}): NavigationState {
  if (navigationState?.stale !== false || !registry.has(navigationState.key)) {
    return createDestinationState(targetState, routeNode, withAnchor, internalParams);
  }

  const targetRoute = getFocusedRoute(targetState);
  if (!targetRoute) {
    return navigationState;
  }

  const action = createResolvedAction({
    targetState: targetState as ResultState,
    navigationState,
    routeNode,
    registry,
    action: { type: 'NAVIGATE', payload: {} },
    withAnchor,
    internalParams,
  });
  const result = registry.get(navigationState.key)?.reduce(navigationState, action);
  if (result?.state.stale !== false || getSelectedRoute(result) === undefined) {
    return createDestinationState(targetState, routeNode, withAnchor, internalParams);
  }

  return isEqual(result.state, navigationState) ? navigationState : result.state;
}

function createDestinationState(
  targetState: PartialState<NavigationState>,
  routeNode: RouteNode,
  withAnchor: boolean,
  internalParams: InternalExpoRouterParams
): NavigationState {
  const targetRoute = getFocusedRoute(targetState);
  const routeNames = routeNode.children.map((child) => child.route);
  if (!targetRoute || !routeNames.includes(targetRoute.name)) {
    return markState(
      createInitialState({
        routeNames,
        initialRouteName: getValidInitialRouteName(routeNode),
      })
    );
  }

  const destination = createInitialState({
    routeNames,
    initialRouteName: targetRoute.name,
  });
  const childNode = findRouteNodeByName(routeNode, targetRoute.name);
  const childState =
    targetRoute.state && childNode
      ? createDestinationState(targetRoute.state, childNode, withAnchor, internalParams)
      : undefined;
  const destinationRoute = {
    ...destination.routes[0]!,
    ...(targetRoute.path !== undefined ? { path: targetRoute.path } : undefined),
    params: appendInternalExpoRouterParams(targetRoute.params, internalParams) ?? {},
    ...(childState !== undefined ? { state: childState } : undefined),
  };
  const initialRouteName = getValidInitialRouteName(routeNode);

  if (withAnchor && initialRouteName && initialRouteName !== targetRoute.name) {
    const initial = createInitialState({ routeNames, initialRouteName });
    return markState({
      ...destination,
      index: 1,
      routes: [initial.routes[0]!, destinationRoute],
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

function findDestinationNode(routeNode: RouteNode, routeName: string | undefined) {
  return routeName === INTERNAL_SLOT_NAME || routeNode.route === routeName
    ? routeNode
    : findRouteNodeByName(routeNode, routeName);
}

function getSelectedRoute(
  result:
    | {
        state: NavigationState | PartialState<NavigationState>;
        affectedRouteKey: string | undefined;
      }
    | null
    | undefined
) {
  if (result?.state.stale !== false || result.affectedRouteKey === undefined) {
    return undefined;
  }
  return result.state.routes.find((route) => route.key === result.affectedRouteKey);
}

function markState<T extends NavigationState>(state: T): T & RouteState {
  return { ...state, __internal__routerActionState: true };
}

// TODO: Move removal-protection registrations into a global registry so resolved trees can run
// checks for route keys they remove before dispatch.
