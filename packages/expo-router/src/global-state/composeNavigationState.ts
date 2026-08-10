import type { ResultState } from '../fork/getStateFromPath';
import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type {
  NavigationAction,
  NavigationRoute,
  NavigationState,
  ParamListBase,
} from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';
import type { RouterRegistry, RouterRegistryEntry } from './routerRegistry';

export const DEFER_NAVIGATION = Symbol('DEFER_NAVIGATION');

type ComposeNavigationStateOptions = {
  navigationState: NavigationState;
  actionState: ResultState;
  actionType: string;
  registry: RouterRegistry;
  withAnchor?: boolean;
  singular?: SingularOptions;
  internalParams?: InternalExpoRouterParams;
};

type ComposeResult = NavigationState | typeof DEFER_NAVIGATION | null;

function getFocusedRoute(state: ResultState) {
  return state.routes[state.index ?? state.routes.length - 1];
}

export function getNavigationActionType(actionType: string, routerType: string): string {
  if (actionType === 'PRELOAD' || actionType === 'REPLACE') {
    return actionType;
  }
  if (routerType === 'expo-tab') {
    return 'JUMP_TO';
  }
  if (actionType === 'POP_TO' && routerType !== 'stack') {
    return 'NAVIGATE';
  }
  return actionType;
}

function attachInternalParamsToFocusedRoute(
  state: ResultState,
  internalParams: InternalExpoRouterParams | undefined
): ResultState {
  const focusedRoute = getFocusedRoute(state);
  if (!focusedRoute || !internalParams || Object.keys(internalParams).length === 0) {
    return state;
  }

  const route = { ...focusedRoute };
  if (focusedRoute.state) {
    route.state = attachInternalParamsToFocusedRoute(
      focusedRoute.state as ResultState,
      internalParams
    );
  } else {
    route.params = { ...route.params, ...internalParams };
  }

  return {
    ...state,
    routes: state.routes.map((candidate) => (candidate === focusedRoute ? route : candidate)),
  };
}

function getActionParams(
  routeParams: object | undefined,
  entry: RouterRegistryEntry,
  hasTail: boolean,
  internalParams: InternalExpoRouterParams | undefined
): object | undefined {
  const params: Record<string, unknown> = { ...routeParams };

  if (entry.routerType === 'stack' && internalParams) {
    Object.assign(params, internalParams);
  } else if (entry.routerType === 'native-tab' && hasTail) {
    params[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME] = true;
  }

  return params;
}

function pruneToFocusedRoutes(state: ResultState): ResultState {
  const focusedRoute = getFocusedRoute(state);
  if (!focusedRoute) {
    return state;
  }

  const route = { ...focusedRoute };
  if (focusedRoute.state) {
    // Path parsing produces this same recursive partial-state shape.
    route.state = pruneToFocusedRoutes(focusedRoute.state as ResultState);
  } else {
    delete route.state;
  }

  return {
    ...state,
    index: 0,
    routes: [route],
  };
}

function getAffectedRoute(
  previousState: NavigationState,
  nextState: NavigationState,
  routeName: string,
  actionType: string
): NavigationRoute<ParamListBase, string> | undefined {
  if (actionType !== 'PRELOAD') {
    return nextState.routes[nextState.index];
  }

  const changedRoutes = nextState.routes.filter((route) => {
    if (route.name !== routeName) {
      return false;
    }
    return previousState.routes.find((previousRoute) => previousRoute.key === route.key) !== route;
  });

  const preloadedRouteKeys =
    'preloadedRouteKeys' in nextState ? nextState.preloadedRouteKeys : undefined;
  if (Array.isArray(preloadedRouteKeys)) {
    const preloadedRoute = changedRoutes.find((route) => preloadedRouteKeys.includes(route.key));
    if (preloadedRoute) {
      return preloadedRoute;
    }
  }

  return (
    changedRoutes[changedRoutes.length - 1] ??
    nextState.routes.findLast((route) => route.name === routeName)
  );
}

function replaceRouteState(
  state: NavigationState,
  routeKey: string,
  childState: NavigationState | ResultState
): NavigationState {
  return {
    ...state,
    routes: state.routes.map((route) =>
      route.key === routeKey ? { ...route, state: childState } : route
    ),
  };
}

export function composeNavigationState({
  navigationState,
  actionState,
  actionType,
  registry,
  withAnchor = false,
  singular,
  internalParams,
}: ComposeNavigationStateOptions): ComposeResult {
  const entry = registry.get(navigationState.key);
  if (!entry) {
    return DEFER_NAVIGATION;
  }

  const actionRoute = getFocusedRoute(actionState);
  if (!actionRoute) {
    return null;
  }

  const nextActionType = getNavigationActionType(actionType, entry.routerType);
  const action: NavigationAction = {
    type: nextActionType,
    target: navigationState.key,
    payload: {
      name: actionRoute.name,
      params: getActionParams(
        actionRoute.params,
        entry,
        actionRoute.state !== undefined,
        internalParams
      ),
      singular,
    },
  };
  const reducedState = entry.reduce(navigationState, action);

  if (reducedState === null || reducedState.stale !== false) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `The ${entry.routerType} router could not handle ${nextActionType} for route '${actionRoute.name}'.`
      );
    }
    return null;
  }

  // `stale: false` distinguishes a complete reducer state from a partial state.
  const nextState = reducedState as NavigationState;
  // The parsed route state recursively has the `ResultState` shape.
  const tail = actionRoute.state as ResultState | undefined;
  if (!tail) {
    return nextState;
  }

  const affectedRoute = getAffectedRoute(
    navigationState,
    nextState,
    actionRoute.name,
    nextActionType
  );
  if (!affectedRoute) {
    return null;
  }

  const previousRoute = navigationState.routes.find((route) => route.key === affectedRoute.key);
  const previousChildState = previousRoute?.state;
  const canReuseChildState =
    previousRoute !== undefined &&
    previousChildState !== undefined &&
    previousChildState.stale === false &&
    'key' in previousChildState &&
    previousChildState === affectedRoute.state;

  if (!canReuseChildState) {
    const partialTail = attachInternalParamsToFocusedRoute(tail, internalParams);
    return replaceRouteState(
      nextState,
      affectedRoute.key,
      withAnchor ? partialTail : pruneToFocusedRoutes(partialTail)
    );
  }

  const childState = affectedRoute.state;
  if (!childState || childState.stale !== false || !('key' in childState)) {
    return DEFER_NAVIGATION;
  }
  if (!registry.has(childState.key)) {
    return DEFER_NAVIGATION;
  }

  const composedChildState = composeNavigationState({
    navigationState: childState,
    actionState: tail,
    actionType,
    registry,
    withAnchor,
    singular: undefined,
    internalParams,
  });
  if (composedChildState === DEFER_NAVIGATION || composedChildState === null) {
    return composedChildState;
  }

  return replaceRouteState(nextState, affectedRoute.key, composedChildState);
}
