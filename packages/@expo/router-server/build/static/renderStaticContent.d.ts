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
/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 *
 * `<head>` tags are captured from shell-ready render state. Metadata produced only after suspended
 * or async work resolves is not guaranteed to appear in the initial HTML head and will reconcile on
 * the client after hydration instead.
 *
 * @privateRemarks This function should be moved to a separate file
 * (i.e. `renderStreamingContent.tsx`) as it doesn't belong with static rendering logic.
 */
export declare function getStreamingContent(location: URL, options?: GetStaticContentOptions): Promise<ReadableStream<Uint8Array>>;
export { getBuildTimeServerManifestAsync, getManifest } from './getServerManifest';
//# sourceMappingURL=renderStaticContent.d.ts.map