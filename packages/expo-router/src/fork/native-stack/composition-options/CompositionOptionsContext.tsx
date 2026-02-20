'use client';

import { useRoute } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createContext, use, useCallback, useId, useMemo, useReducer } from 'react';

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
    if (state[routeKey]?.[componentId] === options) {
      return state;
    }
    return { ...state, [routeKey]: { ...state[routeKey], [componentId]: options } };
  }

  if (action.type === 'unregister') {
    const { routeKey, componentId } = action;
    const existingRoute = state[routeKey];
    if (!existingRoute || !(componentId in existingRoute)) {
      return state;
    }
    // Remove the component entry
    const { [componentId]: _, ...rest } = existingRoute;

    // If no more components for the route, remove the route entry
    if (Object.keys(rest).length === 0) {
      const { [routeKey]: __, ...newState } = state;
      return newState;
    }
    return { ...state, [routeKey]: rest };
  }
  return state;
}

/**
 * Provides the composition registry to descendant composition components.
 *
 * Uses useReducer with immutable object updates for React Compiler compatibility.
 * Each setOptionsFor/unregister call produces a new object reference, which
 * the compiler can track as a reactive dependency.
 */
export function useCompositionRegistry() {
  const [registry, dispatch] = useReducer(registryReducer, {} as CompositionRegistry);

  const setOptionsFor = useCallback(
    (routeKey: string, componentId: string, options: Partial<NativeStackNavigationOptions>) => {
      dispatch({ type: 'set', routeKey, componentId, options });
    },
    []
  );

  const unregister = useCallback((routeKey: string, componentId: string) => {
    dispatch({ type: 'unregister', routeKey, componentId });
  }, []);

  const contextValue = useMemo(
    () => ({ setOptionsFor, unregister }) satisfies CompositionContextValue,
    [setOptionsFor, unregister]
  );
  return { registry, contextValue };
}

/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 * Callers should memoize the options object to avoid unnecessary re-registrations.
 */
export function useCompositionOption(options: Partial<NativeStackNavigationOptions>) {
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
    setOptionsFor(route.key, componentId, options);
  }, [route.key, componentId, setOptionsFor, options]);
}
