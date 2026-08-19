'use client';

import * as React from 'react';

import type { RouteNode } from '../Route';
import type { HandleActionResult } from '../react-navigation/core/NavigationBuilderContext';
import { deepFreeze } from '../react-navigation/core/deepFreeze';
import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import type { InitialState, NavigationAction, NavigationState } from '../react-navigation/routers';
import { getChainFromStateKey } from '../react-navigation/routers/stateKeys';
import useLatestCallback from '../utils/useLatestCallback';
import {
  completeNavigationState,
  createSeededNavigationState,
} from './createSeededNavigationState';
import { indexNavigationTree, reduceNavigationTree, resolveOrigin } from './reduceNavigationTree';
import type { RouterRegistry } from './routerRegistry';

type PendingInternalAction = {
  action: NavigationAction;
  originKey?: string;
};

type Options = {
  initialState: InitialState | undefined;
  routeNode?: RouteNode;
  registry: RouterRegistry;
  onUnhandledAction: (action: NavigationAction) => void;
  onDispatchAction?: (action: NavigationAction, noop: boolean) => void;
  onStateChangeInsertion?: (state: NavigationState) => void;
};

export function useNavigationTreeReducer({
  initialState,
  routeNode,
  registry,
  onUnhandledAction,
  onDispatchAction,
  onStateChangeInsertion,
}: Options) {
  const [state, reactDispatch] = React.useReducer(
    (_: NavigationState, next: NavigationState) => next,
    initialState,
    (value): NavigationState => {
      validateInitialState(value == null ? undefined : value);
      if (value == null) {
        throw new Error(
          'The navigation container is missing its initial state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
        );
      }
      // Validation above proves the recursively partial public type is complete.
      return deepFreeze(value as NavigationState);
    }
  );
  const completedState = React.useMemo(
    () => (routeNode ? completeNavigationState(state, routeNode) : state),
    [routeNode, state]
  );
  // TODO(@ubax): investigate if this is still needed and if we can find a way to remove it
  const pendingStateRef = React.useRef<NavigationState | undefined>(undefined);
  const pendingInternalActionsRef = React.useRef<PendingInternalAction[]>([]);
  const isMountedRef = React.useRef(true);
  const previousRegistryRef = React.useRef(registry);

  const getState = useLatestCallback(() => pendingStateRef.current ?? completedState);
  const getStateForKey = useLatestCallback((key: string) => findStateByKey(getState(), key));
  const commitState = useLatestCallback((nextState: NavigationState) => {
    const completeState = routeNode ? completeNavigationState(nextState, routeNode) : nextState;
    pendingStateRef.current = deepFreeze(completeState);
    reactDispatch(pendingStateRef.current);
  });
  const resetState = useLatestCallback((stateKey: string, nextSlice: NavigationState) => {
    if (!isMountedRef.current) {
      return;
    }
    const currentState = getState();
    const nextState = replaceNavigationState(currentState, stateKey, nextSlice);
    if (nextState !== currentState) {
      commitState(nextState);
    }
  });

  const handleActionImpl = React.useCallback(
    (
      operation: NavigationAction | ((state: NavigationState) => NavigationAction),
      originKey?: string
    ): HandleActionResult => {
      if (!isMountedRef.current) {
        return { handled: false };
      }
      const currentState = getState();
      const tree = indexNavigationTree(currentState);
      const origin = resolveOrigin(tree.rootNode, tree.nodes, registry, originKey);
      if (!origin) {
        // This also covers synchronous actions dispatched before layout-effect registration.
        if (typeof operation !== 'function') {
          const targetKey = typeof operation.target === 'string' ? operation.target : undefined;
          if (
            isDeferredInternalAction(operation) ||
            (originKey !== undefined && tree.nodes.has(originKey)) ||
            (targetKey !== undefined && tree.nodes.has(targetKey) && !registry.has(targetKey))
          ) {
            pendingInternalActionsRef.current.push({ action: operation, originKey });
          } else {
            onUnhandledAction(operation);
          }
        }
        return { handled: false };
      }

      const action = typeof operation === 'function' ? operation(origin.state) : operation;
      const result = reduceNavigationTree(currentState, action, registry, {
        origin,
        tree,
        routeNode,
      });
      if (!result.handled) {
        onUnhandledAction(action);
        return { handled: false };
      }

      onDispatchAction?.(action, result.handlerNoop);
      if (result.treeChanged) {
        const entry = registry.get(result.target.stateKey);
        if (
          action.type !== 'ROUTE_NAMES_CHANGED' &&
          entry?.shouldPreventRemove?.(result.target.prevSlice, result.target.nextSlice, action)
        ) {
          return { handled: true, originStateKey: origin.state.key };
        }
        entry?.emitBeforeRemove?.(result.target.prevSlice, result.target.nextSlice, action);
        commitState(result.nextState);
      }
      return { handled: true, originStateKey: result.originStateKey };
    },
    [commitState, getState, onDispatchAction, onUnhandledAction, registry, routeNode]
  );
  const handleActionRef = React.useRef(handleActionImpl);
  React.useInsertionEffect(() => {
    handleActionRef.current = handleActionImpl;
  }, [handleActionImpl]);
  const handleAction = React.useCallback(
    (
      operation: NavigationAction | ((state: NavigationState) => NavigationAction),
      originKey?: string
    ) => handleActionRef.current(operation, originKey),
    []
  );

  React.useInsertionEffect(() => {
    pendingStateRef.current = completedState;
    onStateChangeInsertion?.(completedState);
  }, [completedState, onStateChangeInsertion]);

  useClientLayoutEffect(() => {
    if (completedState !== state) {
      reactDispatch(completedState);
    }
  }, [completedState, state]);

  useClientLayoutEffect(() => {
    if (registry.size === 0 || pendingInternalActionsRef.current.length === 0) {
      return;
    }
    const pendingActions = pendingInternalActionsRef.current;
    pendingInternalActionsRef.current = [];
    for (const { action, originKey } of pendingActions) {
      handleAction(action, originKey);
    }
  }, [handleAction, registry]);

  useClientLayoutEffect(() => {
    const previousRegistry = previousRegistryRef.current;
    previousRegistryRef.current = registry;
    for (const [stateKey, entry] of previousRegistry) {
      if (!registry.has(stateKey) && entry.routeNode && findStateByKey(completedState, stateKey)) {
        resetState(
          stateKey,
          createSeededNavigationState(undefined, entry.routeNode, getChainFromStateKey(stateKey))
        );
      }
    }
  }, [completedState, registry, resetState]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    state: completedState,
    getState,
    getStateForKey,
    handleAction,
  };
}

function isDeferredInternalAction(action: NavigationAction): boolean {
  return (
    action.type === 'PRELOAD' ||
    action.type === 'REMOVE_ROUTES' ||
    action.type === 'ROUTE_NAMES_CHANGED'
  );
}

function validateInitialState(state: InitialState | undefined): void {
  if (state === undefined) {
    return;
  }

  const index = 'index' in state ? state.index : undefined;
  const routeNames = 'routeNames' in state ? state.routeNames : undefined;
  const routeKeySeq = 'routeKeySeq' in state ? state.routeKeySeq : undefined;
  if (
    !('stale' in state) ||
    state.stale !== false ||
    !('key' in state) ||
    typeof state.key !== 'string' ||
    !Number.isInteger(index) ||
    !Number.isInteger(routeKeySeq) ||
    routeKeySeq! < 0 ||
    !Array.isArray(routeNames) ||
    state.routes.some(
      (route) =>
        !('key' in route) || typeof route.key !== 'string' || !routeNames?.includes(route.name)
    ) ||
    (state.routes.length === 0 ? index !== -1 : index! < 0 || index! >= state.routes.length)
  ) {
    throw new Error(
      'The navigation container received an incomplete initial state. Expo Router always seeds a complete initial state with valid `key`, `routeKeySeq`, `index`, `routeNames`, route keys, and `stale: false` at every level, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }

  for (const route of state.routes) {
    validateInitialState(route.state);
  }
}

export function findStateByKey(root: NavigationState, key: string): NavigationState | undefined {
  if (root.key === key) {
    return root;
  }
  for (const route of root.routes) {
    if (route.state?.stale === false) {
      const state = findStateByKey(route.state, key);
      if (state) {
        return state;
      }
    }
  }
  return undefined;
}

export function replaceNavigationState(
  state: NavigationState,
  stateKey: string,
  replacement: NavigationState
): NavigationState {
  if (state.key === stateKey) {
    return replacement;
  }

  let changed = false;
  const routes = state.routes.map((route) => {
    if (route.state?.stale !== false) {
      return route;
    }
    const nextState = replaceNavigationState(route.state, stateKey, replacement);
    if (nextState === route.state) {
      return route;
    }
    changed = true;
    return { ...route, state: nextState };
  });
  return changed ? { ...state, routes } : state;
}
