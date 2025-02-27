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
export type ExpoRoutesManifestV1<TRegex = string> = {
    apiRoutes: RouteInfo<TRegex>[];
    htmlRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
    redirects: RouteInfo<TRegex>[];
    rewrites: RouteInfo<TRegex>[];
};
export declare function createRoutesManifest(paths: string[], options: Options): ExpoRoutesManifestV1 | null;
//# sourceMappingURL=routes-manifest.d.ts.map