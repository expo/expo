export type RouteInfo<TRegex = string> = {
    file: string;
    page: string;
    namedRegex: TRegex;
    routeKeys: {
        [named: string]: string;
    };
};
export type ExpoRoutesManifestV1<TRegex = string> = {
    apiRoutes: RouteInfo<TRegex>[];
    htmlRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
};
export declare function createRoutesManifest(paths: string[]): ExpoRoutesManifestV1 | null;
//# sourceMappingURL=routes-manifest.d.ts.map