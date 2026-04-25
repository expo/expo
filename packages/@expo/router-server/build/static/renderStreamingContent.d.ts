/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import '@expo/metro-runtime';
import React from 'react';
export type GetStreamingContentOptions = {
    loader?: {
        data?: any;
        key: string;
    };
    metadata?: {
        headNodes: React.ReactNode[];
    } | null;
    request?: Request;
    assets?: {
        css: string[];
        js: string[];
    };
};
export declare function getStreamingContent(location: URL, options?: GetStreamingContentOptions): Promise<ReadableStream<Uint8Array>>;
export { resolveMetadata } from '../utils/metadata/resolve';
//# sourceMappingURL=renderStreamingContent.d.ts.map