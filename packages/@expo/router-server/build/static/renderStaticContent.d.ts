/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
export type GetStaticContentOptions = {
    loader?: {
        data?: any;
        /** Unique key for the route. Derived from the route's contextKey */
        key: string;
    };
    request?: Request;
    /** Asset manifest for hydration bundles (JS/CSS). Used in SSR. */
    assets?: {
        css: string[];
        js: string[];
    };
};
export declare function getStaticContent(location: URL, options?: GetStaticContentOptions): Promise<string>;
export { getBuildTimeServerManifestAsync, getManifest } from './getServerManifest';
//# sourceMappingURL=renderStaticContent.d.ts.map