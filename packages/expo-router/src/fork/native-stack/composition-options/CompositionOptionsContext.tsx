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
  // Options each hidden route keeps, with no component registered for them since it hid.
  const keptOptions = useRef(new Map<string, Set<Partial<NativeStackNavigationOptions>>>());

  const set = useCallback((routeKey: string, options: Partial<NativeStackNavigationOptions>) => {
    keptOptions.current.get(routeKey)?.delete(options);
    dispatch({ type: 'set', routeKey, options });
  }, []);

  const unset = useCallback((routeKey: string, options: Partial<NativeStackNavigationOptions>) => {
    const kept = keptOptions.current.get(routeKey);
    if (kept) {
      kept.add(options);
      return;
    }
    dispatch({ type: 'unset', routeKey, options });
  }, []);

  const hideRoute = useCallback((routeKey: string) => {
    keptOptions.current.set(routeKey, new Set());
  }, []);

  const showRoute = useCallback((routeKey: string) => {
    const kept = keptOptions.current.get(routeKey);
    keptOptions.current.delete(routeKey);
    for (const options of kept ?? []) {
      dispatch({ type: 'unset', routeKey, options });
    }
  }, []);

  useEffect(() => {
    const routeKeys = new Set(routes.map((route) => route.key));
    for (const routeKey of keptOptions.current.keys()) {
      if (!routeKeys.has(routeKey)) {
        keptOptions.current.delete(routeKey);
      }
    }
    if (Object.keys(registry).some((routeKey) => !routeKeys.has(routeKey))) {
      dispatch({ type: 'prune', routeKeys });
    }
  }, [routes, registry]);

  const contextValue = useMemo(
    () => ({ set, unset, hideRoute, showRoute }) satisfies CompositionContextValue,
    [set, unset, hideRoute, showRoute]
  );
  return { registry, contextValue };
}

/**
 * Keeps the route's composition options while the enclosing React `Activity` hides it, so its
 * header doesn't lose them until it shows again. Render it as the first child of the `Activity`.
 */
export function CompositionActivityScope({ children }: { children: ReactNode }) {
  const context = use(CompositionContext);
  const route = useRoute();

  // React runs this cleanup before its descendants' when hiding, and this effect after theirs when
  // showing, so the options they register again in between stay.
  useSafeLayoutEffect(() => {
    if (!context) {
      return;
    }
    context.showRoute(route.key);
    return () => {
      context.hideRoute(route.key);
    };
  }, [context, route.key]);

  return children;
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
