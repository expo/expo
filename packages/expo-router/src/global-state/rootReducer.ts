import isEqual from 'fast-deep-equal';

import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';
import type { NavigatorRegistryEntry, ReducerRegistry } from './storeContext';

type PayloadState = NavigationState | PartialState<NavigationState>;

export type RootReducerResult = {
  state: NavigationState;
  handled: boolean;
  noop: boolean;
  changedSlices: RootReducerChangedSlice[];
};

export type RootReducerChangedSlice = {
  key: string;
  previousState: NavigationState;
  nextState: NavigationState;
  entry: NavigatorRegistryEntry;
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
    return { state: tree, handled: false, noop: true, changedSlices: [] };
  }

  let currentTree = tree;
  let currentPath = path;
  let pathIndex = currentPath.length - 1;
  let handled = false;
  let changed = false;
  const changedSlices: RootReducerChangedSlice[] = [];
  const reducedKeys = new Set<string>();
  let currentAction = getReducerAction(action);

  while (pathIndex >= 0) {
    const state = currentPath[pathIndex]!.state;

    if (reducedKeys.has(state.key)) {
      return handled
        ? { state: currentTree, handled: true, noop: !changed, changedSlices }
        : { state: tree, handled: false, noop: true, changedSlices };
    }

    const entry = registry.getEntry(state.key);

    if (entry == null) {
      return handled
        ? { state: currentTree, handled: true, noop: !changed, changedSlices }
        : { state: tree, handled: false, noop: true, changedSlices };
    }

    const reduced = entry.reduce(state, currentAction);

    if (reduced === null) {
      if (currentAction.target === state.key) {
        return { state: currentTree, handled: true, noop: !changed, changedSlices };
      }

      if (currentAction.target == null) {
        pathIndex -= 1;
        continue;
      }

      return handled
        ? { state: currentTree, handled: true, noop: !changed, changedSlices }
        : { state: tree, handled: false, noop: true, changedSlices };
    }

    reducedKeys.add(state.key);

    handled = true;
    const nextState =
      reduced === state
        ? state
        : normalizePayloadStateParams(
            insertPayloadStateAtBoundary(reduced as NavigationState, currentAction, registry),
            currentAction
          );
    if (nextState !== state) {
      changed = true;
      changedSlices.push({
        key: state.key,
        previousState: state,
        nextState,
        entry,
      });
    }
    currentTree = replacePathState(currentTree, currentPath.slice(0, pathIndex + 1), nextState);

    if (entry.shouldActionChangeFocus?.(currentAction)) {
      const focusResult = focusAncestors(
        currentTree,
        currentPath.slice(0, pathIndex + 1),
        registry,
        changedSlices
      );
      currentTree = focusResult.state;
      changed ||= focusResult.changed;
    }

    if (currentAction.type === 'GO_BACK') {
      return { state: currentTree, handled: true, noop: !changed, changedSlices };
    }

    const focusedRoute = nextState.routes[nextState.index];
    const nestedAction = getNestedActionFromAction(currentAction);

    if (
      focusedRoute?.state == null ||
      focusedRoute.state.stale !== false ||
      !registry.hasReducer(focusedRoute.state.key) ||
      (nestedAction == null && reducedKeys.has(focusedRoute.state.key))
    ) {
      return { state: currentTree, handled: true, noop: !changed, changedSlices };
    }

    if (nestedAction != null) {
      currentAction = nestedAction;
    }
    currentPath = findStatePath(currentTree, focusedRoute.state.key)!;
    pathIndex = currentPath.length - 1;
  }

  return handled
    ? { state: currentTree, handled: true, noop: !changed, changedSlices }
    : { state: tree, handled: false, noop: true, changedSlices };
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

function focusAncestors(
  tree: NavigationState,
  path: PathEntry[],
  registry: ReducerRegistry,
  changedSlices: RootReducerChangedSlice[]
): { state: NavigationState; changed: boolean } {
  let nextTree = tree;
  let changed = false;

  for (let index = path.length - 1; index > 0; index--) {
    const parentKey = path[index - 1]!.state.key;
    const parentPath = findStatePath(nextTree, parentKey);

    if (parentPath == null) {
      continue;
    }

    const parentState = parentPath[parentPath.length - 1]!.state;
    const routeIndex = path[index]!.routeIndex;
    const childRouteKey = routeIndex == null ? undefined : parentState.routes[routeIndex]?.key;
    const parentEntry = registry.getEntry(parentState.key);

    if (childRouteKey == null || parentEntry?.focusRoute == null) {
      continue;
    }

    const focusedState = parentEntry.focusRoute(parentState, childRouteKey) as NavigationState;

    if (focusedState === parentState) {
      continue;
    }

    changed = true;
    changedSlices.push({
      key: parentState.key,
      previousState: parentState,
      nextState: focusedState,
      entry: parentEntry,
    });
    nextTree = replacePathState(nextTree, parentPath, focusedState);
  }

  return { state: nextTree, changed };
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

  const routeIndex = getPayloadBoundaryRouteIndex(state, action, payloadState);
  if (routeIndex == null) {
    return state;
  }

  const route = state.routes[routeIndex];

  if (route == null || route.state != null || registry.hasReducer(payloadState.key ?? '')) {
    return state;
  }

  const routes = state.routes.slice();
  routes[routeIndex] = { ...route, state: payloadState };

  return { ...state, routes };
}

function getPayloadBoundaryRouteIndex(
  state: NavigationState,
  action: NavigationAction,
  payloadState: PayloadState
): number | undefined {
  if (payloadState.key != null) {
    const stateKeyIndex = state.routes.findIndex((route) => route.state?.key === payloadState.key);

    if (stateKeyIndex !== -1) {
      return stateKeyIndex;
    }

    const routeKeyIndex = state.routes.findIndex((route) => route.key === payloadState.key);

    if (routeKeyIndex !== -1) {
      return routeKeyIndex;
    }
  }

  const payload = action.payload;

  if (payload != null && typeof payload === 'object') {
    if ('key' in payload && typeof payload.key === 'string') {
      const keyIndex = state.routes.findIndex((route) => route.key === payload.key);

      if (keyIndex !== -1) {
        return keyIndex;
      }
    }

    if ('name' in payload && typeof payload.name === 'string') {
      const nameIndex = state.routes.findIndex((route) => route.name === payload.name);

      if (nameIndex !== -1) {
        return nameIndex;
      }
    }
  }

  return action.type === 'PRELOAD' ? undefined : (state.index ?? 0);
}

function getPayloadState(action: NavigationAction): PayloadState | undefined {
  const payload = action.payload;

  if (payload != null && 'state' in payload) {
    return payload.state as PayloadState | undefined;
  }

  return undefined;
}

function getNestedActionFromAction(action: NavigationAction): NavigationAction | undefined {
  if (action.type !== 'NAVIGATE' && action.type !== 'NAVIGATE_DEPRECATED') {
    return undefined;
  }

  const payload = action.payload;

  if (payload == null || typeof payload !== 'object') {
    return undefined;
  }

  return 'params' in payload && payload.params != null && typeof payload.params === 'object'
    ? getNestedActionFromRouteParams(payload.params)
    : undefined;
}

function getReducerAction(action: NavigationAction): NavigationAction {
  const payload = action.payload;

  if (
    action.type !== 'PUSH' ||
    payload == null ||
    typeof payload !== 'object' ||
    !('state' in payload) ||
    !hasMultipleRoutes(payload.state) ||
    !('params' in payload) ||
    payload.params == null ||
    typeof payload.params !== 'object' ||
    ('initial' in payload.params && payload.params.initial === false)
  ) {
    return action;
  }

  const nextPayload = { ...payload };
  delete nextPayload.state;

  return {
    ...action,
    payload: nextPayload,
  };
}

function hasMultipleRoutes(state: unknown): state is PayloadState {
  return (
    state != null &&
    typeof state === 'object' &&
    'routes' in state &&
    Array.isArray(state.routes) &&
    state.routes.length > 1
  );
}

function getNestedActionFromRouteParams(params: unknown): NavigationAction | undefined {
  if (params == null || typeof params !== 'object') {
    return undefined;
  }

  if ('state' in params && params.state != null && typeof params.state === 'object') {
    return {
      type: 'RESET',
      payload: params.state as PayloadState,
    };
  }

  if (!('screen' in params) || typeof params.screen !== 'string') {
    return undefined;
  }

  return {
    type: 'NAVIGATE',
    payload: {
      name: params.screen,
      params: 'params' in params ? params.params : undefined,
      path: 'path' in params ? params.path : undefined,
      merge: 'merge' in params ? params.merge : undefined,
      pop: 'pop' in params ? params.pop : undefined,
    },
  };
}

function normalizePayloadStateParams(state: NavigationState, action: NavigationAction) {
  const payloadState = getPayloadState(action);
  const payloadParams = getPayloadParams(action);

  if (payloadState == null) {
    return state;
  }

  return mergeFocusedPayloadParams(
    state,
    payloadState.key,
    payloadParams == null ? undefined : getRealParams(payloadParams)
  );
}

function mergeFocusedPayloadParams(
  state: NavigationState,
  payloadStateKey: string | undefined,
  payloadParams: Record<string, unknown> | undefined
): NavigationState {
  let changed = false;

  const routes = state.routes.map((route) => {
    if (route.state?.key === payloadStateKey) {
      const routeParams =
        route.params == null ? undefined : getRealParams(route.params as Record<string, unknown>);
      const params = { ...payloadParams, ...routeParams };

      if (Object.keys(params).length === 0) {
        return route;
      }

      const nextRouteState = mergeParamsIntoFocusedLeaf(route.state as NavigationState, params);

      if (nextRouteState !== route.state) {
        changed = true;
        return { ...route, state: nextRouteState as NavigationState };
      }
    }

    return route;
  });

  return changed ? { ...state, routes } : state;
}

function mergeParamsIntoFocusedLeaf(
  state: NavigationState | PartialState<NavigationState>,
  params: Record<string, unknown>
): NavigationState | PartialState<NavigationState> {
  const focusedIndex = state.index ?? 0;
  const focusedRoute = state.routes[focusedIndex];

  if (focusedRoute == null) {
    return state;
  }

  if (focusedRoute.state != null) {
    const nextChildState = mergeParamsIntoFocusedLeaf(focusedRoute.state, params);

    if (nextChildState === focusedRoute.state) {
      return state;
    }

    const routes = state.routes.slice();
    routes[focusedIndex] = { ...focusedRoute, state: nextChildState } as (typeof routes)[number];
    return { ...state, routes } as typeof state;
  }

  const nextParams = { ...params, ...focusedRoute.params };

  if (isEqual(nextParams, focusedRoute.params)) {
    return state;
  }

  const routes = state.routes.slice();
  routes[focusedIndex] = { ...focusedRoute, params: nextParams } as (typeof routes)[number];
  return { ...state, routes } as typeof state;
}

function getPayloadParams(action: NavigationAction): Record<string, unknown> | undefined {
  const payload = action.payload;

  if (payload != null && 'params' in payload && typeof payload.params === 'object') {
    return payload.params as Record<string, unknown>;
  }

  return undefined;
}

function getRealParams(params: Record<string, unknown>): Record<string, unknown> {
  const result = { ...params };

  delete result.screen;
  delete result.initial;
  delete result.params;
  delete result.path;
  delete result.merge;
  delete result.pop;

  return result;
}
