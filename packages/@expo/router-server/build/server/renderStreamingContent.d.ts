/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ReactNode } from 'react';
export type GetStreamingContentOptions = {
    loader?: {
        data?: any;
        /** Unique key for the route. Derived from the route's contextKey */
        key: string;
    };
    metadata?: {
        headNodes: ReactNode[];
    } | null;
    request?: Request;
    /** Assets for hydration bundles and development-only inline CSS. */
    assets?: {
        css: string[];
        /** CSS source to inline into the document head, used by development SSR. */
        inlineCss?: {
            source: string;
            hmrId?: string;
        }[];
        js: string[];
    };
};
/**
 * Streaming SSR renderer using `renderToReadableStream`. Returns a web `ReadableStream`
 * that emits the full HTML document with head injections applied.
 */
export declare function getStreamingContent(location: URL, options?: GetStreamingContentOptions): Promise<ReadableStream<Uint8Array>>;
export { resolveMetadata } from './metadata';
//# sourceMappingURL=renderStreamingContent.d.ts.map