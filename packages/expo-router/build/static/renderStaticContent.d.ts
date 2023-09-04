/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
/** Get the linking manifest from a Node.js process. */
declare function getManifest(options: any): Promise<{
    initialRouteName?: string | undefined;
    screens: Record<string, import("../getReactNavigationConfig").Screen>;
}>;
export declare function getStaticContent(location: URL): string;
export { getManifest };
//# sourceMappingURL=renderStaticContent.d.ts.map