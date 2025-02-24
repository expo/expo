import { type Options } from './getRoutesSSR.mjs';
export { Options } from './getRoutes.mjs';
export type RouteInfo<TRegex = string> = {
    file: string;
    page: string;
    namedRegex: TRegex;
    routeKeys: Record<string, string>;
};
export type ExpoRoutesManifestV1<TRegex = string> = {
    apiRoutes: RouteInfo<TRegex>[];
    htmlRoutes: RouteInfo<TRegex>[];
    notFoundRoutes: RouteInfo<TRegex>[];
};
export declare function createRoutesManifest(paths: string[], options: Options): ExpoRoutesManifestV1 | null;
//# sourceMappingURL=routes-manifest.d.mts.map