/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
import { Options } from '../getRoutes';
/** Get the linking manifest from a Node.js process. */
declare function getManifest(options?: Options): Promise<{
    path?: string | undefined;
    screens: import("@react-navigation/native").PathConfigMap<Record<string, unknown>>;
    initialRouteName?: string | undefined;
} | undefined>;
export declare function getStaticContent(location: URL): Promise<string>;
export { getManifest };
export { getBuildTimeServerManifestAsync } from './getServerManifest';
//# sourceMappingURL=renderStaticContent.d.ts.map