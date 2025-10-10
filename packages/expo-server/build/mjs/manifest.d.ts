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
    namedRegex: TRegex;
    routeKeys: Record<string, string>;
    permanent?: boolean;
    methods?: string[];
}
export interface RoutesManifest<TRegex = RegExp | string> {
    middleware?: MiddlewareInfo;
    headers?: Record<string, string | string[]>;
    apiRoutes: RouteInfo<TRegex>[];
    htmlRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
    redirects: RouteInfo<TRegex>[];
    rewrites: RouteInfo<TRegex>[];
}
export type RawManifest = RoutesManifest<string>;
export type Manifest = RoutesManifest<RegExp>;
export type Route = RouteInfo<RegExp>;
