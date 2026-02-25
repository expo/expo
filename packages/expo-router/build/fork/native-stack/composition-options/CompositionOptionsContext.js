"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositionContext = void 0;
exports.registryReducer = registryReducer;
exports.useCompositionRegistry = useCompositionRegistry;
exports.useCompositionOption = useCompositionOption;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const useSafeLayoutEffect_1 = require("../../../views/useSafeLayoutEffect");
/** @internal */
exports.CompositionContext = (0, react_1.createContext)(null);
/** @internal */
function registryReducer(state, action) {
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
function useCompositionRegistry() {
    const [registry, dispatch] = (0, react_1.useReducer)(registryReducer, {});
    const set = (0, react_1.useCallback)((routeKey, options) => {
        dispatch({ type: 'set', routeKey, options });
    }, []);
    const unset = (0, react_1.useCallback)((routeKey, options) => {
        dispatch({ type: 'unset', routeKey, options });
    }, []);
    const contextValue = (0, react_1.useMemo)(() => ({ set, unset }), [set, unset]);
    return { registry, contextValue };
}
/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 * Callers should memoize the options object to avoid unnecessary re-registrations.
 */
function useCompositionOption(options) {
    const context = (0, react_1.use)(exports.CompositionContext);
    if (!context) {
        throw new Error('useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.');
    }
    const route = (0, native_1.useRoute)();
    const { set, unset } = context;
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        set(route.key, options);
        return () => {
            unset(route.key, options);
        };
    }, [route.key, set, unset, options]);
}
//# sourceMappingURL=CompositionOptionsContext.js.map