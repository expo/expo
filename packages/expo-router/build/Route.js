import React, { useContext } from 'react';
import { getContextKey, matchGroupName } from './matchers';
const CurrentRouteContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    CurrentRouteContext.displayName = 'RouteNode';
}
/** Return the RouteNode at the current contextual boundary. */
export function useRouteNode() {
    return useContext(CurrentRouteContext);
}
export function useContextKey() {
    const node = useRouteNode();
    if (node == null) {
        throw new Error('No filename found. This is likely a bug in expo-router.');
    }
    return getContextKey(node.contextKey);
}
/** Provides the matching routes and filename to the children. */
export function Route({ children, node }) {
    return React.createElement(CurrentRouteContext.Provider, { value: node }, children);
}
export function sortRoutesWithInitial(initialRouteName) {
    return (a, b) => {
        if (initialRouteName) {
            if (a.route === initialRouteName) {
                return -1;
            }
            if (b.route === initialRouteName) {
                return 1;
            }
        }
        return sortRoutes(a, b);
    };
}
export function sortRoutes(a, b) {
    if (a.dynamic && !b.dynamic) {
        return 1;
    }
    if (!a.dynamic && b.dynamic) {
        return -1;
    }
    if (a.dynamic && b.dynamic) {
        if (a.dynamic.length !== b.dynamic.length) {
            return b.dynamic.length - a.dynamic.length;
        }
        for (let i = 0; i < a.dynamic.length; i++) {
            const aDynamic = a.dynamic[i];
            const bDynamic = b.dynamic[i];
            if (aDynamic.deep && !bDynamic.deep) {
                return 1;
            }
            if (!aDynamic.deep && bDynamic.deep) {
                return -1;
            }
        }
        return 0;
    }
    const aIndex = a.route === 'index' || matchGroupName(a.route) != null;
    const bIndex = b.route === 'index' || matchGroupName(b.route) != null;
    if (aIndex && !bIndex) {
        return -1;
    }
    if (!aIndex && bIndex) {
        return 1;
    }
    return a.route.length - b.route.length;
}
//# sourceMappingURL=Route.js.map