'use client';
import { createContext, use } from 'react';
import { getContextKey } from './matchers';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
const CurrentRouteContext = createContext(null);
/** This context allows a `_layout.tsx` to provide a Suspense fallback for its child routes. */
export const SuspenseFallbackContext = createContext(undefined);
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
export function Route({ children, node, params }) {
    return (<LocalRouteParamsContext.Provider value={params}>
      <CurrentRouteContext.Provider value={node}>{children}</CurrentRouteContext.Provider>
    </LocalRouteParamsContext.Provider>);
}
export { sortRoutesWithInitial, sortRoutes };
//# sourceMappingURL=Route.js.map