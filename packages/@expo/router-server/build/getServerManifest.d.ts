/**
 * Copyright © 2023 650 Industries.
 * Copyright © 2023 Vercel, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on https://github.com/vercel/next.js/blob/1df2686bc9964f1a86c444701fa5cbf178669833/packages/next/src/shared/lib/router/utils/route-regex.ts
 */
import { type RouteNode } from 'expo-router/internal/routing';
import { type RoutesManifest } from 'expo-server/private';
export interface Group {
    pos: number;
    repeat: boolean;
    optional: boolean;
}
export interface RouteRegex {
    groups: Record<string, Group>;
    re: RegExp;
}
type GetServerManifestOptions = {
    headers?: Record<string, string | string[]>;
};
export declare function getServerManifest(route: RouteNode, options: GetServerManifestOptions | undefined): RoutesManifest<string>;
export declare function parseParameter(param: string): {
    name: string;
    repeat: boolean;
    optional: boolean;
};
export {};
//# sourceMappingURL=getServerManifest.d.ts.map