'use client';
import { createContext, use } from 'react';
import { getContextKey } from '@expo/router-server/src/matchers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
const CurrentRouteContext = createContext(null);
export const LocalRouteParamsContext = createContext({});
if (process.env.NODE_ENV !== 'production') {
    CurrentRouteContext.displayName = 'RouteNode';
}
/** Return the RouteNode at the current contextual boundary. */
export function useRouteNode() {
    return use(CurrentRouteContext);
}
export function useContextKey() {
    const node = useRouteNode();
    if (node == null) {
        throw new Error('No filename found. This is likely a bug in expo-router.');
    }
    return getContextKey(node.contextKey);
}
/** Provides the matching routes and filename to the children. */
export function Route({ children, node, route }) {
    return (<LocalRouteParamsContext.Provider value={route?.params}>
      <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>
    </LocalRouteParamsContext.Provider>);
}
export { sortRoutesWithInitial, sortRoutes };
//# sourceMappingURL=Route.js.map