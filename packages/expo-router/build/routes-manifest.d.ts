import { type Options } from './getRoutesSSR';
export { Options };
export type RouteInfo<TRegex = string> = {
    file: string;
    page: string;
    namedRegex: TRegex;
    routeKeys: Record<string, string>;
    permanent?: boolean;
    methods?: string[];
};
/**
 * Middleware pattern type that can be a string (including globs) or a regular expression.
 */
export type MiddlewarePattern = string | RegExp;
export type MiddlewareMatcher = {
    /**
     * Array of path patterns to match against.
     * Supports string literals, glob patterns, and regex.
     * @example ['/api/*', '/admin/*', { pattern: '^/(auth)/(login|logout)$', regex: true }]
     */
    patterns: MiddlewarePattern[];
    /**
     * HTTP methods to match (undefined = all methods)
     * @example ['POST', 'PUT', 'DELETE']
     */
    methods?: string[];
};
export type MiddlewareInfo = {
    /**
     * Path to the module that contains the middleware function as a default export.
     *
     * @example _expo/functions/+middleware.js
     */
    file: string;
    /**
     * Optional matcher configuration for conditional middleware execution.
     * When undefined, middleware runs on all requests.
     *
     * @example
     * ```ts
     * // In +middleware.ts
     * export const settings = {
     *   matcher: {
     *     patterns: ['/api/*', '/(auth)/*'],
     *     methods: ['POST', 'PUT', 'DELETE']
     *   }
     * };
     * ```
     */
    matcher?: MiddlewareMatcher;
};
export type ExpoRoutesManifestV1<TRegex = string> = {
    middleware?: MiddlewareInfo;
    apiRoutes: RouteInfo<TRegex>[];
    htmlRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
    redirects: RouteInfo<TRegex>[];
    rewrites: RouteInfo<TRegex>[];
};
export declare function createRoutesManifest(paths: string[], options: Options): ExpoRoutesManifestV1 | null;
//# sourceMappingURL=routes-manifest.d.ts.map