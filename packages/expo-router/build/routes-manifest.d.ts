export type RouteInfo<TRegex = string> = {
    page: string;
    namedRegex: TRegex;
    routeKeys: {
        [named: string]: string;
    };
};
export type ExpoRoutesManifestV1<TRegex = string> = {
    dynamicRoutes: RouteInfo<TRegex>[];
    staticRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
};
export declare function createRoutesManifest(): Promise<any>;
//# sourceMappingURL=routes-manifest.d.ts.map