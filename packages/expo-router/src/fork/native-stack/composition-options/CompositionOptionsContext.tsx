'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import { useRoute } from '../../../react-navigation/native';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';
import { useSafeLayoutEffect } from '../../../views/useSafeLayoutEffect';
import type { CompositionContextValue, CompositionRegistry } from './types';

/** @internal */
export const CompositionContext = createContext<CompositionContextValue | null>(null);

type RegistryAction =
  | {
      type: 'set';
      routeKey: string;
      options: Partial<NativeStackNavigationOptions>;
    }
  | { type: 'unset'; routeKey: string; options: Partial<NativeStackNavigationOptions> }
  | { type: 'prune'; routeKeys: ReadonlySet<string> };

/** @internal */
export function registryReducer(
  state: CompositionRegistry,
  action: RegistryAction
): CompositionRegistry {
  if (action.type === 'set') {
    const { routeKey, options } = action;
    if (state[routeKey]?.includes(options)) {
      return state;
    }
    return { ...state, [routeKey]: [...(state[routeKey] ?? []), options] };
  }

  if (action.type === 'unset') {
    const { routeKey, options } = action;
    const existing = state[routeKey];
    const filtered = existing?.filter((o) => o !== options);
    if (!existing || filtered?.length === existing.length) {
      return state;
    }
    if (!filtered?.length) {
      const { [routeKey]: _, ...newState } = state;
      return newState;
    }
    return { ...state, [routeKey]: filtered };
  }

  if (action.type === 'prune') {
    const removedKeys = Object.keys(state).filter((key) => !action.routeKeys.has(key));
    if (removedKeys.length === 0) {
      return state;
    }
    const newState = { ...state };
    for (const key of removedKeys) {
      delete newState[key];
    }
    return newState;
  }
  return state;
}

/**
 * Provides the composition registry to descendant composition components.
 *
 * Uses useReducer with immutable object updates for React Compiler compatibility.
 * Each set/unset call produces a new object reference, which the compiler can
 * track as a reactive dependency.
 */
export function useCompositionRegistry(routes: readonly { key: string }[]) {
  const [registry, dispatch] = useReducer(registryReducer, {} as CompositionRegistry);

  const set = useCallback((routeKey: string, options: Partial<NativeStackNavigationOptions>) => {
    dispatch({ type: 'set', routeKey, options });
  }, []);

  const unset = useCallback((routeKey: string, options: Partial<NativeStackNavigationOptions>) => {
    dispatch({ type: 'unset', routeKey, options });
  }, []);

  useEffect(() => {
    const routeKeys = new Set(routes.map((route) => route.key));
    if (Object.keys(registry).some((routeKey) => !routeKeys.has(routeKey))) {
      dispatch({ type: 'prune', routeKeys });
    }
  }, [routes, registry]);

  const contextValue = useMemo(
    () => ({ set, unset }) satisfies CompositionContextValue,
    [set, unset]
  );
  return { registry, contextValue };
}

/**
 * Keeps the composition options of its descendants while the enclosing React `Activity` hides
 * them, so the route's header doesn't lose them until it shows again. Render it as the first child
 * of the `Activity`.
 */
export function CompositionActivityScope({ children }: { children: ReactNode }) {
  const parent = use(CompositionContext);
  // Options of descendants unregistered while hidden, with their route keys, or null while shown.
  const keptOptions = useRef<Map<Partial<NativeStackNavigationOptions>, string> | null>(null);

  const contextValue = useMemo(
    () =>
      parent &&
      ({
        set(routeKey, options) {
          keptOptions.current?.delete(options);
          parent.set(routeKey, options);
        },
        unset(routeKey, options) {
          if (keptOptions.current) {
            keptOptions.current.set(options, routeKey);
          } else {
            parent.unset(routeKey, options);
          }
        },
      } satisfies CompositionContextValue),
    [parent]
  );

  // React runs this cleanup before its descendants' when hiding, and this effect after theirs when
  // showing, so the options they register again in between stay.
  useSafeLayoutEffect(() => {
    const kept = keptOptions.current;
    keptOptions.current = null;
    for (const [options, routeKey] of kept ?? []) {
      parent?.unset(routeKey, options);
    }
    return () => {
      keptOptions.current = new Map();
    };
  }, [parent]);

  return <CompositionContext value={contextValue}>{children}</CompositionContext>;
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

  const route = useRoute();
  const { set, unset } = context;

  useSafeLayoutEffect(() => {
    set(route.key, options);
    return () => {
      unset(route.key, options);
    };
  }, [route.key, set, unset, options]);
}
