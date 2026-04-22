'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationBuilderContext, } from './NavigationBuilderContext';
import { NavigationRouteContext } from './NavigationProvider';
const VISITED_ROUTE_KEYS = Symbol('VISITED_ROUTE_KEYS');
export const shouldPreventRemove = (emitter, beforeRemoveListeners, currentRoutes, nextRoutes, action) => {
    const nextRouteKeys = nextRoutes.map((route) => route.key);
    // Call these in reverse order so last screens handle the event first
    const removedRoutes = currentRoutes
        .filter((route) => !nextRouteKeys.includes(route.key))
        .reverse();
    const visitedRouteKeys = 
    // @ts-expect-error: add this property to mark that we've already emitted this action
    action[VISITED_ROUTE_KEYS] ?? new Set();
    const beforeRemoveAction = {
        ...action,
        [VISITED_ROUTE_KEYS]: visitedRouteKeys,
    };
    for (const route of removedRoutes) {
        if (visitedRouteKeys.has(route.key)) {
            // Skip if we've already emitted this action for this screen
            continue;
        }
        // First, we need to check if any child screens want to prevent it
        const isPrevented = beforeRemoveListeners[route.key]?.(beforeRemoveAction);
        if (isPrevented) {
            return true;
        }
        visitedRouteKeys.add(route.key);
        const event = emitter.emit({
            type: 'beforeRemove',
            target: route.key,
            data: { action: beforeRemoveAction },
            canPreventDefault: true,
        });
        if (event.defaultPrevented) {
            return true;
        }
    }
    return false;
};
export function useOnPreventRemove({ getState, emitter, beforeRemoveListeners }) {
    const { addKeyedListener } = use(NavigationBuilderContext);
    const route = use(NavigationRouteContext);
    const routeKey = route?.key;
    React.useEffect(() => {
        if (routeKey) {
            return addKeyedListener?.('beforeRemove', routeKey, (action) => {
                const state = getState();
                return shouldPreventRemove(emitter, beforeRemoveListeners, state.routes, [], action);
            });
        }
    }, [addKeyedListener, beforeRemoveListeners, emitter, getState, routeKey]);
}
//# sourceMappingURL=useOnPreventRemove.js.map