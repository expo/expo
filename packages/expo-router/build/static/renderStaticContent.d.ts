/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
import { getRoutes } from '../getRoutes';
/** Get the linking manifest from a Node.js process. */
declare function getManifest(options?: Parameters<typeof getRoutes>[1]): Promise<{
    initialRouteName?: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
}>;
/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
declare function getBuildTimeServerManifestAsync(options?: Parameters<typeof getRoutes>[1]): Promise<{
    apiRoutes: {
        generated: boolean | undefined;
        file: string;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
    htmlRoutes: {
        generated: boolean | undefined;
        file: string;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
    notFoundRoutes: {
        generated: boolean | undefined;
        file: string;
        page: string;
        namedRegex: string;
        routeKeys: {
            [named: string]: string;
        };
    }[];
}>;
export declare function getStaticContent(location: URL): string;
export { getManifest, getBuildTimeServerManifestAsync };
//# sourceMappingURL=renderStaticContent.d.ts.map