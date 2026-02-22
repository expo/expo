/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { URL, URLSearchParams } from 'whatwg-url-minimum';
declare module 'whatwg-url-minimum' {
    type BlobLike = Blob & {
        data?: {
            blobId: string;
            offset: number;
        };
    };
    interface URLConstructor {
        createObjectURL(blob: BlobLike): string;
        revokeObjectURL(url: URL): void;
    }
}
export { URL, URLSearchParams };
//# sourceMappingURL=url.d.ts.map