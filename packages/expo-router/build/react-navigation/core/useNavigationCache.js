"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationCache = useNavigationCache;
const React = __importStar(require("react"));
const routers_1 = require("../routers");
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
/**
 * Hook to cache navigation objects for each screen in the navigator.
 * It's important to cache them to make sure navigation objects don't change between renders.
 * This lets us apply optimizations like `React.memo` to minimize re-rendering screens.
 */
function useNavigationCache({ state, getState, navigation, setOptions, router, emitter, }) {
    const { stackRef } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    const base = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { emit, ...rest } = navigation;
        const actions = {
            ...router.actionCreators,
            ...routers_1.CommonActions,
        };
        const dispatch = () => {
            throw new Error('Actions cannot be dispatched from a placeholder screen.');
        };
        const helpers = Object.keys(actions).reduce((acc, name) => {
            acc[name] = dispatch;
            return acc;
        }, {});
        return {
            ...rest,
            ...helpers,
            addListener: () => {
                // Event listeners are not supported for placeholder screens
                return () => {
                    // Empty function
                };
            },
            removeListener: () => {
                // Event listeners are not supported for placeholder screens
            },
            dispatch,
            getParent: (id) => {
                if (id !== undefined && id === rest.getId()) {
                    return base;
                }
                return rest.getParent(id);
            },
            setOptions: () => {
                throw new Error('Options cannot be set from a placeholder screen.');
            },
            isFocused: () => false,
        };
    }, [navigation, router.actionCreators]);
    // Cache object which holds navigation objects for each screen
    // We use `React.useMemo` instead of `React.useRef` coz we want to invalidate it when deps change
    // In reality, these deps will rarely change, if ever
    const cache = React.useMemo(() => ({ current: {} }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, getState, navigation, setOptions, emitter]);
    cache.current = state.routes.reduce((acc, route) => {
        const previous = cache.current[route.key];
        if (previous) {
            // If a cached navigation object already exists, reuse it
            acc[route.key] = previous;
        }
        else {
            const dispatch = (thunk) => {
                const action = typeof thunk === 'function' ? thunk(getState()) : thunk;
                if (action != null) {
                    navigation.dispatch({ source: route.key, ...action });
                }
            };
            const withStack = (callback) => {
                let isStackSet = false;
                try {
                    if (process.env.NODE_ENV !== 'production' && stackRef && !stackRef.current) {
                        // Capture the stack trace for devtools
                        stackRef.current = new Error().stack;
                        isStackSet = true;
                    }
                    callback();
                }
                finally {
                    if (isStackSet && stackRef) {
                        stackRef.current = undefined;
                    }
                }
            };
            const actions = {
                ...router.actionCreators,
                ...routers_1.CommonActions,
            };
            const helpers = Object.keys(actions).reduce((acc, name) => {
                acc[name] = (...args) => withStack(() => 
                // @ts-expect-error: name is a valid key, but TypeScript is dumb
                dispatch(actions[name](...args)));
                return acc;
            }, {});
            acc[route.key] = {
                ...base,
                ...helpers,
                // FIXME: too much work to fix the types for now
                ...emitter.create(route.key),
                dispatch: (thunk) => withStack(() => dispatch(thunk)),
                getParent: (id) => {
                    if (id !== undefined && id === base.getId()) {
                        // If the passed id is the same as the current navigation id,
                        // we return the cached navigation object for the relevant route
                        return acc[route.key];
                    }
                    return base.getParent(id);
                },
                setOptions: (options) => {
                    setOptions((o) => ({
                        ...o,
                        [route.key]: { ...o[route.key], ...options },
                    }));
                },
                isFocused: () => {
                    const state = base.getState();
                    if (state.routes[state.index].key !== route.key) {
                        return false;
                    }
                    // If the current screen is focused, we also need to check if parent navigator is focused
                    // This makes sure that we return the focus state in the whole tree, not just this navigator
                    return navigation ? navigation.isFocused() : true;
                },
            };
        }
        return acc;
    }, {});
    return {
        base,
        navigations: cache.current,
    };
}
//# sourceMappingURL=useNavigationCache.js.map