'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';
import { isArrayEqual } from './isArrayEqual';
export function useOnGetState({ getState, getStateListeners }) {
    const { addKeyedListener } = use(NavigationBuilderContext);
    const route = use(NavigationRouteContext);
    const key = route ? route.key : 'root';
    const getRehydratedState = React.useCallback(() => {
        const state = getState();
        // Avoid returning new route objects if we don't need to
        const routes = state.routes.map((route) => {
            const childState = getStateListeners[route.key]?.();
            if (route.state === childState) {
                return route;
            }
            return { ...route, state: childState };
        });
        if (isArrayEqual(state.routes, routes)) {
            return state;
        }
        return { ...state, routes };
    }, [getState, getStateListeners]);
    React.useEffect(() => {
        return addKeyedListener?.('getState', key, getRehydratedState);
    }, [addKeyedListener, getRehydratedState, key]);
}
//# sourceMappingURL=useOnGetState.js.map