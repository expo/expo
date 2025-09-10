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
export type MiddlewareInfo = {
    /**
     * Path to the module that contains the middleware function as a default export.
     *
     * @example _expo/functions/+middleware.js
     */
    file: string;
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