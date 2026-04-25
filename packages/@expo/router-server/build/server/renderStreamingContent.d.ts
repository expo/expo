/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export type GetStreamingContentOptions = {
    loader?: {
        data?: any;
        /** Unique key for the route. Derived from the route's contextKey */
        key: string;
    };
    metadata?: {
        headTags: string;
    } | null;
    request?: Request;
    /** Asset manifest for hydration bundles (JS/CSS). Used in SSR. */
    assets?: {
        css: string[];
        js: string[];
    };
};
/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 *
 * `<head>` tags are captured from shell-ready render state. Metadata produced only after suspended
 * or async work resolves is not guaranteed to appear in the initial HTML head and will reconcile on
 * the client after hydration instead.
 */
export declare function getStreamingContent(location: URL, options?: GetStreamingContentOptions): Promise<ReadableStream<Uint8Array>>;
export { resolveMetadata } from './metadata';
//# sourceMappingURL=renderStreamingContent.d.ts.map