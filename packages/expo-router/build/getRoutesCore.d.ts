import type { DynamicConvention, RouteNode } from './Route';
import type { RequireContext } from './types';
export type Options = {
    ignore?: RegExp[] | undefined;
    preserveApiRoutes?: boolean | undefined;
    ignoreRequireErrors?: boolean | undefined;
    ignoreEntryPoints?: boolean | undefined;
    internal_stripLoadRoute?: boolean | undefined;
    skipGenerated?: boolean | undefined;
    /** Skip routes created by `generateStaticParams()` */
    skipStaticParams?: boolean | undefined;
    notFound?: boolean | undefined;
    unstable_useServerMiddleware?: boolean | undefined;
    importMode?: string | undefined;
    platformRoutes?: boolean | undefined;
    sitemap?: boolean | undefined;
    platform?: string | undefined;
    redirects?: RedirectConfig[] | undefined;
    rewrites?: RewriteConfig[] | undefined;
    headers?: Record<string, string | string[]> | undefined;
    preserveRedirectAndRewrites?: boolean | undefined;
    /** Get the system route for a location. Useful for shimming React Native imports in SSR environments. */
    getSystemRoute: (route: Pick<RouteNode, 'route' | 'type'> & {
        defaults?: RouteNode;
        redirectConfig?: RedirectConfig;
        rewriteConfig?: RewriteConfig;
    }) => RouteNode;
};
export type RedirectConfig = {
    source: string;
    destination: string;
    destinationContextKey: string;
    permanent?: boolean | undefined;
    methods?: string[] | undefined;
    external?: boolean | undefined;
};
export type RewriteConfig = {
    source: string;
    destination: string;
    destinationContextKey: string;
    methods?: string[] | undefined;
};
/**
 * Given a Metro context module, return an array of nested routes.
 *
 * This is a two step process:
 *  1. Convert the RequireContext keys (file paths) into a directory tree.
 *      - This should extrapolate array syntax into multiple routes
 *      - Routes are given a specificity score
 *  2. Flatten the directory tree into routes
 *      - Routes in directories without _layout files are hoisted to the nearest _layout
 *      - The name of the route is relative to the nearest _layout
 *      - If multiple routes have the same name, the most specific route is used
 */
export declare function getRoutes(contextModule: RequireContext, options: Options): RouteNode | null;
/**
 * Generates a set of strings which have the router array syntax extrapolated.
 *
 * /(a,b)/(c,d)/e.tsx => new Set(['a/c/e.tsx', 'a/d/e.tsx', 'b/c/e.tsx', 'b/d/e.tsx'])
 */
export declare function extrapolateGroups(key: string, keys?: Set<string>): Set<string>;
export declare function generateDynamic(path: string): DynamicConvention[] | null;
//# sourceMappingURL=getRoutesCore.d.ts.map