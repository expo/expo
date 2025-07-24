import { type ComponentType, type PropsWithChildren } from 'react';
import { sortRoutesWithInitial, sortRoutes } from './sortRoutes';
import { type ErrorBoundaryProps } from './views/Try';
export type DynamicConvention = {
    name: string;
    deep: boolean;
    notFound?: boolean;
};
export type LoadedRoute = {
    ErrorBoundary?: ComponentType<ErrorBoundaryProps>;
    default?: ComponentType<any>;
    unstable_settings?: Record<string, any>;
    getNavOptions?: (args: any) => any;
    generateStaticParams?: (props: {
        params?: Record<string, string | string[]>;
    }) => Record<string, string | string[]>[];
};
export type LoadedMiddleware = Pick<LoadedRoute, 'default' | 'unstable_settings'>;
export type MiddlewareNode = {
    /** Context Module ID. Used to resolve the middleware module */
    contextKey: string;
    /** Loads middleware into memory. Returns the exports from +middleware.ts */
    loadRoute: () => Partial<LoadedMiddleware>;
};
export type RouteNode = {
    /** The type of RouteNode */
    type: 'route' | 'api' | 'layout' | 'redirect' | 'rewrite';
    /** Load a route into memory. Returns the exports from a route. */
    loadRoute: () => Partial<LoadedRoute>;
    /** Loaded initial route name. */
    initialRouteName?: string;
    /** Nested routes */
    children: RouteNode[];
    /** Is the route a dynamic path */
    dynamic: null | DynamicConvention[];
    /** `index`, `error-boundary`, etc. */
    route: string;
    /** Context Module ID, used for matching children. */
    contextKey: string;
    /** Redirect Context Module ID, used for matching children. */
    destinationContextKey?: string;
    /** Is the redirect permanent. */
    permanent?: boolean;
    /** Added in-memory */
    generated?: boolean;
    /** Internal screens like the directory or the auto 404 should be marked as internal. */
    internal?: boolean;
    /** File paths for async entry modules that should be included in the initial chunk request to ensure the runtime JavaScript matches the statically rendered HTML representation. */
    entryPoints?: string[];
    /** HTTP methods for this route. If undefined, assumed to be ['GET'] */
    methods?: string[];
    /** Middleware function for server-side request processing. Only present on the root route node. */
    middleware?: MiddlewareNode;
};
export declare const LocalRouteParamsContext: import("react").Context<Record<string, string | undefined> | undefined>;
/** Return the RouteNode at the current contextual boundary. */
export declare function useRouteNode(): RouteNode | null;
export declare function useContextKey(): string;
export type RouteProps = PropsWithChildren<{
    node: RouteNode;
    route?: {
        params: Record<string, string | undefined>;
    };
}>;
/** Provides the matching routes and filename to the children. */
export declare function Route({ children, node, route }: RouteProps): import("react").JSX.Element;
export { sortRoutesWithInitial, sortRoutes };
//# sourceMappingURL=Route.d.ts.map