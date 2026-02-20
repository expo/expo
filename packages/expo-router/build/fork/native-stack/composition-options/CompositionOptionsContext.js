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
function useCompositionRegistry() {
    const [registry, dispatch] = (0, react_1.useReducer)(registryReducer, {});
    const setOptionsFor = (0, react_1.useCallback)((routeKey, componentId, options) => {
        dispatch({ type: 'set', routeKey, componentId, options });
    }, []);
    const unregister = (0, react_1.useCallback)((routeKey, componentId) => {
        dispatch({ type: 'unregister', routeKey, componentId });
    }, []);
    const contextValue = (0, react_1.useMemo)(() => ({ setOptionsFor, unregister }), [setOptionsFor, unregister]);
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
    const componentId = (0, react_1.useId)();
    const route = (0, native_1.useRoute)();
    const { setOptionsFor, unregister } = context;
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        return () => {
            unregister(route.key, componentId);
        };
    }, [route.key, componentId, unregister]);
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        setOptionsFor(route.key, componentId, options);
    }, [route.key, componentId, setOptionsFor, options]);
}
//# sourceMappingURL=CompositionOptionsContext.js.map