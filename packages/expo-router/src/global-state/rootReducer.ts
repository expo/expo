import isEqual from 'fast-deep-equal';

import {
  focusChild,
  isFocusChangingAction,
  type NavigationAction,
  type NavigationState,
  type PartialState,
} from '../react-navigation/routers';
import type { ReducerRegistry } from './storeContext';

type PayloadState = NavigationState | PartialState<NavigationState>;

export type RootReducerResult = {
  state: NavigationState;
  handled: boolean;
  noop: boolean;
  // TODO(prevent-remove): this result used to carry a `changedSlices` side-channel (the per-slice
  // before/after states `focusAncestors` also fed) that the dispatch-time prevent-remove gate
  // consumed. Reintroduce it (or an equivalent) when navigation prevention returns.
  // Set only when a NAVIGATE/RESET carried a nested `screen`/`state` intent that could not be
  // applied in this pass: `deferred` when the destination child navigator is not yet committed and
  // registered (the container replays it after bootstrap), `rejected` when a registered child
  // refused it (eligible for `lastUnhandled` capture). Absent means the parent had no nested intent
  // or a registered child consumed it.
  nestedBoundary?: RootReducerNestedBoundary;
};

export type RootReducerNestedBoundary =
  | {
      type: 'deferred';
      // Route in the committed parent whose child navigator must exist before the action can drain.
      parentRouteKey: string;
      // Expected child state key when the parent already carries a (stale/absent) slice.
      childStateKey: string | undefined;
      action: NavigationAction;
      // Stored route params after the parent reducer ran — used for consumption identity, since a
      // router may clone params while merging `initialParams`.
      routeParams: object | undefined;
    }
  | {
      type: 'rejected';
      parentRouteKey: string;
      action: NavigationAction;
    };

type PathEntry = {
  state: NavigationState;
  routeIndex?: number;
};

// Public entry point. Kept as a thin delegator over `reduceRoot` so that a test spying on this
// export (or the eager dispatch path) observes exactly one reduction per dispatch: the Step-2 shadow
// `useReducer` reduces through `reduceRoot` directly (see `createShadowReducer`), bypassing this
// symbol, so it doesn't inflate that call count.
export function rootReducer(
  tree: NavigationState,
  action: NavigationAction,
  registry: ReducerRegistry,
  options: { originKey?: string } = {}
): RootReducerResult {
  return reduceRoot(tree, action, registry, options);
}

export type ShadowState = { tree: NavigationState; seq: number };
export type ShadowEnvelope = {
  action: NavigationAction;
  options?: { originKey?: string };
  seq: number;
};

// The reducer for the Step-2 shadow `useReducer`, closing over the registry. It calls `reduceRoot`
// directly (not the `rootReducer` export) so a spy on `rootReducer` sees only the eager path, and
// consumes an envelope carrying the same `originKey` the eager path used plus the dispatch's `seq`
// (so the container can compare the shadow against the eager tree of the *same* dispatch, immune to
// the shadow's one-commit lag). TODO(step-5): the shadow becomes the authoritative reducer and this
// adapter is deleted.
export function createShadowReducer(registry: ReducerRegistry) {
  return (state: ShadowState, envelope: ShadowEnvelope): ShadowState => ({
    tree: reduceRoot(state.tree, envelope.action, registry, envelope.options ?? {}).state,
    seq: envelope.seq,
  });
}

export function reduceRoot(
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
  const reducedKeys = new Set<string>();
  let currentAction = action;
  let nestedBoundary: RootReducerNestedBoundary | undefined;
  // Set once the loop switches to a decoded nested action, so a later `null` reduction can be
  // captured as a `rejected` boundary and attributed to the route it descended through.
  let nestedParentRouteKey: string | undefined;

  while (pathIndex >= 0) {
    const state = currentPath[pathIndex]!.state;

    if (reducedKeys.has(state.key)) {
      return handled
        ? { state: currentTree, handled: true, noop: !changed, nestedBoundary }
        : { state: tree, handled: false, noop: true };
    }

    const entry = registry.getEntry(state.key);

    if (entry == null) {
      return handled
        ? { state: currentTree, handled: true, noop: !changed, nestedBoundary }
        : { state: tree, handled: false, noop: true };
    }

    let reduced = entry.reduce(state, currentAction);

    // Navigating into an ALREADY-MOUNTED nested navigator: the descent carries the parent's action
    // down (so a deeper unmounted boundary still gets `payload.state` spliced), but a mounted child
    // often can't apply that action verbatim — e.g. the action names the parent's route, not one of
    // the child's. When it can't, reconcile the child toward `payload.state` by navigating it to the
    // subtree's focused route. This is the reach the legacy nested-param chain gives for mounted
    // children.
    if (reduced === null) {
      const payloadStateAction = getNestedActionFromPayloadState(currentAction);
      if (payloadStateAction != null) {
        const payloadReduced = entry.reduce(state, payloadStateAction);
        if (payloadReduced !== null) {
          reduced = payloadReduced;
          currentAction = payloadStateAction;
        }
      }
    }

    if (reduced === null) {
      if (nestedParentRouteKey != null && nestedBoundary == null) {
        nestedBoundary = {
          type: 'rejected',
          parentRouteKey: nestedParentRouteKey,
          action: currentAction,
        };
      }

      if (currentAction.target === state.key) {
        return { state: currentTree, handled: true, noop: !changed, nestedBoundary };
      }

      if (currentAction.target == null) {
        pathIndex -= 1;
        continue;
      }

      return handled
        ? { state: currentTree, handled: true, noop: !changed, nestedBoundary }
        : { state: tree, handled: false, noop: true };
    }

    reducedKeys.add(state.key);

    handled = true;
    const nextState =
      reduced === state
        ? state
        : completeNavigationState(
            normalizePayloadStateParams(
              insertPayloadStateAtBoundary(reduced as NavigationState, currentAction),
              currentAction
            )
          );
    if (nextState !== state) {
      changed = true;
    }
    currentTree = replacePathState(currentTree, currentPath.slice(0, pathIndex + 1), nextState);

    if (isFocusChangingAction(currentAction)) {
      const focusResult = focusAncestors(
        currentTree,
        currentPath.slice(0, pathIndex + 1),
        registry
      );
      currentTree = focusResult.state;
      changed ||= focusResult.changed;
    }

    if (currentAction.type === 'GO_BACK') {
      return { state: currentTree, handled: true, noop: !changed, nestedBoundary };
    }

    const focusedRoute = nextState.routes[nextState.index];
    const nestedAction = getNestedActionFromAction(currentAction);
    const childState = focusedRoute?.state;
    const childReady =
      childState != null && childState.stale === false && registry.hasReducer(childState.key);

    if (!childReady) {
      // A nested intent that can't descend yet: the container replays it once the destination
      // navigator is committed and registered.
      if (nestedAction != null && focusedRoute != null) {
        nestedBoundary = {
          type: 'deferred',
          parentRouteKey: focusedRoute.key,
          childStateKey: childState?.key,
          action: nestedAction,
          routeParams: focusedRoute.params,
        };
      }

      return { state: currentTree, handled: true, noop: !changed, nestedBoundary };
    }

    if (nestedAction == null && reducedKeys.has(childState.key)) {
      return { state: currentTree, handled: true, noop: !changed, nestedBoundary };
    }

    if (nestedAction != null) {
      currentAction = nestedAction;
      nestedParentRouteKey = focusedRoute!.key;
    }
    currentPath = findStatePath(currentTree, childState.key)!;
    pathIndex = currentPath.length - 1;
  }

  return handled
    ? { state: currentTree, handled: true, noop: !changed, nestedBoundary }
    : { state: tree, handled: false, noop: true };
}

function completeNavigationState(state: NavigationState): NavigationState {
  let changed = state.stale !== false;
  const routes = state.routes.map((route) => {
    const childState = route.state;
    const nextChildState = childState
      ? completeNavigationState(childState as NavigationState)
      : undefined;

    if (nextChildState === childState) {
      return route;
    }

    changed = true;
    return { ...route, state: nextChildState };
  });

  return changed ? { ...state, stale: false, routes } : state;
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
  registry: ReducerRegistry
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

    if (childRouteKey == null || parentEntry == null) {
      continue;
    }

    // Refocus the ancestor by reducing a synthetic FOCUS_CHILD action through its registered reducer.
    // A router that doesn't focus-change returns `null` (unhandled) or `parentState` (no-op).
    const focusedState = parentEntry.reduce(
      parentState,
      focusChild(childRouteKey)
    ) as NavigationState | null;

    if (focusedState == null || focusedState === parentState) {
      continue;
    }

    changed = true;
    nextTree = replacePathState(nextTree, parentPath, focusedState);
  }

  return { state: nextTree, changed };
}

function insertPayloadStateAtBoundary(
  state: NavigationState,
  action: NavigationAction
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

  if (route == null || route.state != null) {
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
  if (
    action.type !== 'NAVIGATE' &&
    action.type !== 'NAVIGATE_DEPRECATED' &&
    action.type !== 'PUSH'
  ) {
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
      merge: 'merge' in params ? params.merge : undefined,
      pop: 'pop' in params ? params.pop : undefined,
    },
  };
}

// Unwrap one level of a `payload.state` subtree into a nested NAVIGATE: navigate the mounted child
// to the subtree's focused route, carrying that route's own subtree as the next `payload.state`.
// Recursing this per level walks the action down a chain of mounted navigators (mirroring how the
// old nested-param descent reached mounted children), while unmounted boundaries below are filled
// by `insertPayloadStateAtBoundary` as the descent reaches them.
function getNestedActionFromPayloadState(action: NavigationAction): NavigationAction | undefined {
  if (
    action.type !== 'NAVIGATE' &&
    action.type !== 'NAVIGATE_DEPRECATED' &&
    action.type !== 'PUSH'
  ) {
    return undefined;
  }

  const payloadState = getPayloadState(action);

  if (payloadState == null) {
    return undefined;
  }

  const focused = payloadState.routes[payloadState.index ?? payloadState.routes.length - 1];

  if (focused == null) {
    return undefined;
  }

  return {
    type: 'NAVIGATE',
    payload: {
      name: focused.name,
      params: focused.params,
      ...(focused.state != null ? { state: focused.state } : null),
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
  delete result.merge;
  delete result.pop;

  return result;
}
