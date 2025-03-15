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
    /**
     * Keys are route param names that have been normalized for a regex named-matcher, values are the original route param names.
     */
    routeKeys: Record<string, string>;
    /**
     * Regex for matching a path against the route.
     * The regex is normalized for named matchers so keys must be looked up against the `routeKeys` object to collect the original route param names.
     * Regex matching alone cannot accurately route to a file, the order in which routes are matched is equally important to ensure correct priority.
     */
    namedRegex: TRegex;
    /** Indicates that the route was generated and does not map to any file in the project's routes directory. */
    generated?: boolean;
    /** Indicates that this is a redirect that should use 301 instead of 307 */
    permanent?: boolean;
    /** If a redirect, which methods are allowed. Undefined represents all methods */
    methods?: string[];
};
export type ExpoRouterServerManifestV1<TRegex = string> = {
    /**
     * Rewrites. These occur first
     */
    rewrites: ExpoRouterServerManifestV1Route<TRegex>[];
    /**
     * List of routes that match second. Returns 301 and redirects to another path.
     */
    redirects: ExpoRouterServerManifestV1Route<TRegex>[];
    /**
     * Routes that return static HTML files for a given path.
     * These are only matched against requests with method `GET` and `HEAD`.
     */
    htmlRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
    /**
     * Routes that are matched after HTML routes and invoke WinterCG-compliant functions.
     */
    apiRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
    /** List of routes that are matched last and return with status code 404. */
    notFoundRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
};
export interface Group {
    pos: number;
    repeat: boolean;
    optional: boolean;
}
export interface RouteRegex {
    groups: Record<string, Group>;
    re: RegExp;
}
export declare function getServerManifest(route: RouteNode): ExpoRouterServerManifestV1;
export declare function parseParameter(param: string): {
    name: string;
    repeat: boolean;
    optional: boolean;
};
//# sourceMappingURL=getServerManifest.d.ts.map