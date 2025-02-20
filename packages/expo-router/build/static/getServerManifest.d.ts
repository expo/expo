/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Options } from '../getRoutes';
import { ExpoRouterServerManifestV1 } from '../getServerManifest';
/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
export declare function getBuildTimeServerManifestAsync(options?: Options): Promise<ExpoRouterServerManifestV1>;
/** Get the linking manifest from a Node.js process. */
export declare function getManifest(options?: Options): Promise<{
    initialRouteName: undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
}>;
//# sourceMappingURL=getServerManifest.d.ts.map