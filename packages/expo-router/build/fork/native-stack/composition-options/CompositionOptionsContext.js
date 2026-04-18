'use client';
import { createContext, use, useCallback, useMemo, useReducer } from 'react';
import { useRoute } from '../../../react-navigation/native';
import { useSafeLayoutEffect } from '../../../views/useSafeLayoutEffect';
/** @internal */
export const CompositionContext = createContext(null);
/** @internal */
export function registryReducer(state, action) {
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
        if (filtered.length === 0) {
            const { [routeKey]: _, ...newState } = state;
            return newState;
        }
        return { ...state, [routeKey]: filtered };
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
export function useCompositionRegistry() {
    const [registry, dispatch] = useReducer(registryReducer, {});
    const set = useCallback((routeKey, options) => {
        dispatch({ type: 'set', routeKey, options });
    }, []);
    const unset = useCallback((routeKey, options) => {
        dispatch({ type: 'unset', routeKey, options });
    }, []);
    const contextValue = useMemo(() => ({ set, unset }), [set, unset]);
    return { registry, contextValue };
}
/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 * Callers should memoize the options object to avoid unnecessary re-registrations.
 */
export function useCompositionOption(options) {
    const context = use(CompositionContext);
    if (!context) {
        throw new Error('useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.');
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
//# sourceMappingURL=CompositionOptionsContext.js.map