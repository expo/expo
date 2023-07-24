import React, { ReactNode } from "react";
import type { ErrorBoundaryProps } from "./exports";
export type DynamicConvention = {
    name: string;
    deep: boolean;
};
export type LoadedRoute = {
    ErrorBoundary?: React.ComponentType<ErrorBoundaryProps>;
    default?: React.ComponentType<any>;
    unstable_settings?: Record<string, any>;
    getNavOptions?: (args: any) => any;
    generateStaticParams?: (props: {
        params?: Record<string, string | string[]>;
    }) => Record<string, string | string[]>[];
};
export type RouteNode = {
    /** Load a route into memory. Returns the exports from a route. */
    loadRoute: () => Partial<LoadedRoute>;
    /** Loaded initial route name. */
    initialRouteName?: string;
    /** nested routes */
    children: RouteNode[];
    /** Is the route a dynamic path */
    dynamic: null | DynamicConvention[];
    /** `index`, `error-boundary`, etc. */
    route: string;
    /** Context Module ID, used for matching children. */
    contextKey: string;
    /** Added in-memory */
    generated?: boolean;
    /** Internal screens like the directory or the auto 404 should be marked as internal. */
    internal?: boolean;
};
/** Return the RouteNode at the current contextual boundary. */
export declare function useRouteNode(): RouteNode | null;
export declare function useContextKey(): string;
/** Provides the matching routes and filename to the children. */
export declare function Route({ children, node, }: {
    children: ReactNode;
    node: RouteNode;
}): JSX.Element;
export declare function sortRoutesWithInitial(initialRouteName?: string): (a: RouteNode, b: RouteNode) => number;
export declare function sortRoutes(a: RouteNode, b: RouteNode): number;
//# sourceMappingURL=Route.d.ts.map