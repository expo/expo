/**
 * Copyright © 2023 650 Industries.
 * Copyright © 2023 Vercel, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on https://github.com/vercel/next.js/blob/1df2686bc9964f1a86c444701fa5cbf178669833/packages/next/src/shared/lib/router/utils/route-regex.ts
 */
import type { RouteNode } from './Route';
export type ExpoRouterServerManifestV1Route<TRegex = string> = {
    file: string;
    page: string;
    routeKeys: Record<string, string>;
    namedRegex: TRegex;
    generated?: boolean;
};
export type ExpoRouterServerManifestV1<TRegex = string> = {
    apiRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
    htmlRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
    notFoundRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
};
export interface Group {
    pos: number;
    repeat: boolean;
    optional: boolean;
}
export interface RouteRegex {
    groups: {
        [groupName: string]: Group;
    };
    re: RegExp;
}
export declare function getServerManifest(route: RouteNode): ExpoRouterServerManifestV1;
export declare function getNamedRouteRegex(normalizedRoute: string, page: string): ExpoRouterServerManifestV1Route;
//# sourceMappingURL=getServerManifest.d.ts.map