'use client';
import * as React from 'react';
import { use } from 'react';
import { CommonActions, } from '../routers';
import { NavigationBuilderContext } from './NavigationBuilderContext';
/**
 * Hook to cache navigation objects for each screen in the navigator.
 * It's important to cache them to make sure navigation objects don't change between renders.
 * This lets us apply optimizations like `React.memo` to minimize re-rendering screens.
 */
export function useNavigationCache({ state, getState, navigation, setOptions, router, emitter, }) {
    const { stackRef } = use(NavigationBuilderContext);
    const base = React.useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { emit, ...rest } = navigation;
        const actions = {
            ...router.actionCreators,
            ...CommonActions,
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
                ...CommonActions,
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