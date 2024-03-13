'use client';
import React, { useContext } from 'react';
import { getContextKey } from './matchers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
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
    return <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>;
}
export { sortRoutesWithInitial, sortRoutes };
//# sourceMappingURL=Route.js.map