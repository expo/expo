'use client';

import { useRoute } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createContext, use, useCallback, useId, useReducer, type DependencyList } from 'react';

import type { CompositionContextValue, CompositionRegistry } from './types';
import { useSafeLayoutEffect } from '../../../views/useSafeLayoutEffect';

/** @internal */
export const CompositionContext = createContext<CompositionContextValue | null>(null);

type RegistryAction =
  | {
      type: 'set';
      routeKey: string;
      componentId: string;
      options: Partial<NativeStackNavigationOptions>;
    }
  | { type: 'unregister'; routeKey: string; componentId: string };

/** @internal */
export function registryReducer(
  state: CompositionRegistry,
  action: RegistryAction
): CompositionRegistry {
  if (action.type === 'set') {
    const { routeKey, componentId, options } = action;
    const existingRouteMap = state.get(routeKey);
    const newRouteMap = new Map(existingRouteMap);
    newRouteMap.set(componentId, options);
    const newState = new Map(state);
    newState.set(routeKey, newRouteMap);
    return newState;
  }

  if (action.type === 'unregister') {
    const { routeKey, componentId } = action;
    const existingRouteMap = state.get(routeKey);
    if (!existingRouteMap || !existingRouteMap.has(componentId)) {
      return state;
    }
    const newRouteMap = new Map(existingRouteMap);
    newRouteMap.delete(componentId);
    const newState = new Map(state);
    if (newRouteMap.size === 0) {
      newState.delete(routeKey);
    } else {
      newState.set(routeKey, newRouteMap);
    }
    return newState;
  }
  return state;
}

/**
 * Provides the composition registry to descendant composition components.
 *
 * Uses useReducer with immutable Map updates for React Compiler compatibility.
 * Each setOptionsFor/unregister call produces a new Map reference, which
 * the compiler can track as a reactive dependency.
 */
export function useCompositionRegistry() {
  const [registry, dispatch] = useReducer(registryReducer, new Map() as CompositionRegistry);

  const setOptionsFor = useCallback(
    (routeKey: string, componentId: string, options: Partial<NativeStackNavigationOptions>) => {
      dispatch({ type: 'set', routeKey, componentId, options });
    },
    []
  );

  const unregister = useCallback((routeKey: string, componentId: string) => {
    dispatch({ type: 'unregister', routeKey, componentId });
  }, []);

  return {
    registry,
    contextValue: { setOptionsFor, unregister } satisfies CompositionContextValue,
  };
}

/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 * The factory is only called when dependencies change (like `useMemo`).
 */
export function useCompositionOption(
  factory: () => Partial<NativeStackNavigationOptions>,
  dependencies: DependencyList
) {
  const context = use(CompositionContext);
  if (!context) {
    throw new Error(
      'useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.'
    );
  }

  const componentId = useId();

  const route = useRoute();
  const { setOptionsFor, unregister } = context;

  useSafeLayoutEffect(() => {
    return () => {
      unregister(route.key, componentId);
    };
  }, [route.key, componentId, unregister]);

  useSafeLayoutEffect(() => {
    setOptionsFor(route.key, componentId, factory());
  }, [route.key, componentId, setOptionsFor, ...dependencies]);
}
