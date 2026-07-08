import isEqual from 'fast-deep-equal';

import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import type { ReducerRegistry } from './storeContext';

type PayloadState = NavigationState | PartialState<NavigationState>;

export type RootReducerResult = {
  state: NavigationState;
  handled: boolean;
  noop: boolean;
};

export type RootReducerShadowMismatch = {
  message: string;
  action: NavigationAction;
  predictedState: NavigationState;
  committedState: NavigationState;
};

type PathEntry = {
  state: NavigationState;
  routeIndex?: number;
};

export function rootReducer(
  tree: NavigationState,
  action: NavigationAction,
  registry: ReducerRegistry,
  options: { originKey?: string } = {}
): RootReducerResult {
  const target = action.target ?? options.originKey ?? tree.key;
  const path = findStatePath(tree, target);

  if (path == null) {
    return { state: tree, handled: false, noop: true };
  }

  let currentTree = tree;
  let currentPath = path;
  let pathIndex = currentPath.length - 1;
  let handled = false;
  let changed = false;

  while (pathIndex >= 0) {
    const state = currentPath[pathIndex]!.state;
    const entry = registry.getEntry(state.key);

    if (entry == null) {
      return handled
        ? { state: currentTree, handled: true, noop: !changed }
        : { state: tree, handled: false, noop: true };
    }

    const reduced = entry.reduce(state, action);

    if (reduced === null) {
      if (action.target === state.key) {
        return { state: currentTree, handled: true, noop: !changed };
      }

      if (action.target == null) {
        pathIndex -= 1;
        continue;
      }

      return handled
        ? { state: currentTree, handled: true, noop: !changed }
        : { state: tree, handled: false, noop: true };
    }

    handled = true;
    const nextState =
      reduced === state
        ? state
        : insertPayloadStateAtBoundary(reduced as NavigationState, action, registry);
    changed ||= nextState !== state;
    currentTree = replacePathState(currentTree, currentPath.slice(0, pathIndex + 1), nextState);

    const focusedRoute = nextState.routes[nextState.index];

    if (
      focusedRoute?.state == null ||
      focusedRoute.state.stale !== false ||
      !registry.hasReducer(focusedRoute.state.key)
    ) {
      return { state: currentTree, handled: true, noop: !changed };
    }

    currentPath = findStatePath(currentTree, focusedRoute.state.key)!;
    pathIndex = currentPath.length - 1;
  }

  return handled
    ? { state: currentTree, handled: true, noop: !changed }
    : { state: tree, handled: false, noop: true };
}

export function getRootReducerShadowMismatch({
  action,
  predictedState,
  committedState,
}: {
  action: NavigationAction;
  predictedState: NavigationState;
  committedState: NavigationState;
}): RootReducerShadowMismatch | null {
  if (isEqual(predictedState, committedState)) {
    return null;
  }

  const target = action.target == null ? 'none' : action.target;

  return {
    message: `Root reducer shadow mismatch for ${action.type} (target: ${target})`,
    action,
    predictedState,
    committedState,
  };
}

function findStatePath(state: NavigationState, key: string): PathEntry[] | null {
  if (state.key === key) {
    return [{ state }];
  }

  for (let routeIndex = 0; routeIndex < state.routes.length; routeIndex++) {
    const route = state.routes[routeIndex]!;

    if (route.state == null || route.state.stale !== false) {
      continue;
    }

    const childPath = findStatePath(route.state as NavigationState, key);

    if (childPath != null) {
      return [{ state }, { ...childPath[0]!, routeIndex }, ...childPath.slice(1)];
    }
  }

  return null;
}

function replacePathState(
  root: NavigationState,
  path: PathEntry[],
  replacement: NavigationState
): NavigationState {
  let nextState: NavigationState = replacement;

  for (let index = path.length - 1; index > 0; index--) {
    const parent = path[index - 1]!.state;
    const routeIndex = path[index]!.routeIndex!;
    const routes = parent.routes.slice();
    const route = routes[routeIndex]!;

    routes[routeIndex] = { ...route, state: nextState };
    nextState = { ...parent, routes };
  }

  return nextState as NavigationState;
}

function insertPayloadStateAtBoundary(
  state: NavigationState,
  action: NavigationAction,
  registry: ReducerRegistry
): NavigationState {
  const payloadState = getPayloadState(action);

  if (payloadState == null) {
    return state;
  }

  const route = state.routes[state.index ?? 0];

  if (route == null || route.state != null || registry.hasReducer(payloadState.key ?? '')) {
    return state;
  }

  const routes = state.routes.slice();
  routes[state.index ?? 0] = { ...route, state: payloadState };

  return { ...state, routes };
}

function getPayloadState(action: NavigationAction): PayloadState | undefined {
  const payload = action.payload;

  if (payload != null && 'state' in payload) {
    return payload.state as PayloadState | undefined;
  }

  return undefined;
}
