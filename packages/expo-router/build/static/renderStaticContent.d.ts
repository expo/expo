/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
import { Options } from '../getRoutes';
import { ExpoRouterServerManifestV1 } from '../getServerManifest';
/** Get the linking manifest from a Node.js process. */
declare function getManifest(options?: Options): Promise<{
    initialRouteName: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
}>;
/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
declare function getBuildTimeServerManifestAsync(options?: Options): Promise<ExpoRouterServerManifestV1>;
export declare function getStaticContent(location: URL): Promise<string>;
export { getManifest, getBuildTimeServerManifestAsync };
//# sourceMappingURL=renderStaticContent.d.ts.map