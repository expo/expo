"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositionContext = void 0;
exports.registryReducer = registryReducer;
exports.useCompositionRegistry = useCompositionRegistry;
exports.useCompositionOption = useCompositionOption;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const utils_1 = require("../../../link/preview/utils");
const useSafeLayoutEffect_1 = require("../../../views/useSafeLayoutEffect");
/** @internal */
exports.CompositionContext = (0, react_1.createContext)(null);
/** @internal */
function registryReducer(state, action) {
    if (action.type === 'set') {
        const { routeKey, componentId, options } = action;
        const existingRouteMap = state.get(routeKey);
        const existingOptions = existingRouteMap?.get(componentId);
        if (existingOptions && (0, utils_1.deepEqual)(existingOptions, options)) {
            return state;
        }
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
        }
        else {
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
function useCompositionRegistry() {
    const [registry, dispatch] = (0, react_1.useReducer)(registryReducer, new Map());
    const setOptionsFor = (0, react_1.useCallback)((routeKey, componentId, options) => {
        dispatch({ type: 'set', routeKey, componentId, options });
    }, []);
    const unregister = (0, react_1.useCallback)((routeKey, componentId) => {
        dispatch({ type: 'unregister', routeKey, componentId });
    }, []);
    return {
        registry,
        contextValue: { setOptionsFor, unregister },
    };
}
/**
 * Hook used by composition components to register their options in the composition registry.
 *
 * Registers options on mount/update via useSafeLayoutEffect, and unregisters on unmount.
 */
function useCompositionOption(options) {
    const context = (0, react_1.use)(exports.CompositionContext);
    if (!context) {
        throw new Error('useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.');
    }
    const componentId = (0, react_1.useId)();
    const route = (0, native_1.useRoute)();
    const previousOptionsRef = (0, react_1.useRef)({});
    const { setOptionsFor, unregister } = context;
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        return () => {
            unregister(route.key, componentId);
        };
    }, [route.key, componentId, unregister]);
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if ((0, utils_1.deepEqual)(previousOptionsRef.current, options)) {
            return;
        }
        setOptionsFor(route.key, componentId, options);
        previousOptionsRef.current = options;
    }, [route.key, componentId, options, setOptionsFor, unregister]);
}
//# sourceMappingURL=CompositionOptionsContext.js.map