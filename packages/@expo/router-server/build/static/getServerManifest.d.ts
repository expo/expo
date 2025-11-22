/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type GetRoutesOptions } from 'expo-router/internal/routing';
import { type RoutesManifest } from 'expo-server/private';
/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `@expo/router-server/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
export declare function getBuildTimeServerManifestAsync(options?: GetRoutesOptions): Promise<RoutesManifest<string>>;
/** Get the linking manifest from a Node.js process. */
export declare function getManifest(options?: GetRoutesOptions): Promise<{
    initialRouteName: undefined;
    screens: Record<string, import("expo-router/build/getReactNavigationConfig").Screen>;
}>;
//# sourceMappingURL=getServerManifest.d.ts.map