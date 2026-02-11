/**
 * Asset manifest for client hydration bundles.
 *
 * {@link import('@expo/router-server/src/static/renderStaticContent').GetStaticContentOptions}
 */
export interface AssetInfo {
    css: string[];
    js: string[];
}
/**
 * Rendering configuration. Discriminated union supporting multiple rendering modes.
 */
export type RenderingConfiguration = RenderingConfigurationForSSR;
/**
 * Configuration for server-side rendering (SSR). HTML is rendered at runtime on each request.
 */
export interface RenderingConfigurationForSSR {
    mode: 'ssr';
    /** Path to the SSR render module, typically `_expo/server/render.js` */
    file: string;
}
export interface MiddlewareInfo {
    /**
     * Path to the module that contains the middleware function as a default export.
     *
     * @example _expo/functions/+middleware.js
     */
    file: string;
}
export interface RouteInfo<TRegex = RegExp | string> {
    file: string;
    page: string;
    /**
     * Regex for matching a path against the route.
     * The regex is normalized for named matchers so keys must be looked up against the `routeKeys` object to collect the original route param names.
     * Regex matching alone cannot accurately route to a file, the order in which routes are matched is equally important to ensure correct priority.
     */
    namedRegex: TRegex;
    /**
     * Keys are route param names that have been normalized for a regex named-matcher, values are the original route param names.
     */
    routeKeys: Record<string, string>;
    /** Indicates that the route was generated and does not map to any file in the project's routes directory. */
    generated?: boolean;
    /** Indicates that this is a redirect that should use 301 instead of 307 */
    permanent?: boolean;
    /** If a redirect, which methods are allowed. Undefined represents all methods */
    methods?: string[];
    /** Path to the loader module for this route, typically `_expo/loaders/[ROUTE].js`. When present, the loader should be executed before rendering. */
    loader?: string;
}
export interface RoutesManifest<TRegex = RegExp | string> {
    /**
     * Middleware function that runs before any route matching.
     * Only allowed at the root level and requires web.output: "server".
     */
    middleware?: MiddlewareInfo;
    /**
     * Headers to be applied to all responses from the server.
     */
    headers?: Record<string, string | string[]>;
    /**
     * Routes that are matched after HTML routes and invoke WinterCG-compliant functions.
     */
    apiRoutes: RouteInfo<TRegex>[];
    /**
     * Routes that return static HTML files for a given path.
     * These are only matched against requests with method `GET` and `HEAD`.
     */
    htmlRoutes: RouteInfo<TRegex>[];
    /**
     * List of routes that are matched last and return with status code 404.
     */
    notFoundRoutes: RouteInfo<TRegex>[];
    /**
     * List of routes that match second. Returns 301 and redirects to another path.
     */
    redirects: RouteInfo<TRegex>[];
    /**
     * Rewrites. After middleware has processed and regular routing resumes, these occur first.
     */
    rewrites: RouteInfo<TRegex>[];
    /**
     * CSS/JS assets. Used for client hydration in SSR mode.
     */
    assets?: AssetInfo;
    /**
     * Rendering configuration. Determines how HTML is generated.
     * When present, HTML routes are rendered at runtime instead of being served from pre-rendered files.
     */
    rendering?: RenderingConfiguration;
}
export type RawManifest = RoutesManifest<string>;
export type Manifest = RoutesManifest<RegExp>;
export type Route = RouteInfo<RegExp>;
/**
 * @type {import('@expo/router-server/src/static/renderStaticContent').GetStaticContentOptions}
 */
export interface GetStaticContentOptions {
    loader?: {
        data?: unknown;
        key: string;
    };
    request?: Request;
    assets?: AssetInfo;
}
