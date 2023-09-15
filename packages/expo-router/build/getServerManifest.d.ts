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
export declare function getServerManifest(route: RouteNode): {
    apiRoutes: {
        generated: boolean | undefined;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
    htmlRoutes: {
        generated: boolean | undefined;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
    notFoundRoutes: {
        generated: boolean | undefined;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
};
export declare function getNamedRouteRegex(normalizedRoute: string, page: string): {
    page: string;
    namedRegex: string;
    routeKeys: {
        [named: string]: string;
    };
};
//# sourceMappingURL=getServerManifest.d.ts.map