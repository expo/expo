/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Remix Software Inc. 2020-2021
 * Copyright (c) Shopify Inc. 2022-2024
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Original license https://github.com/remix-run/remix/blob/6d6caaed5dfc436242962dcb2ff9617757a11e17/LICENSE.md
 * Code from https://github.com/remix-run/remix/blob/6d6caaed5dfc436242962dcb2ff9617757a11e17/packages/remix-node/stream.ts#L66
 */
import type { Readable } from 'node:stream';
export declare const createReadableStreamFromReadable: (source: Readable & {
    readableHighWaterMark?: number;
}) => ReadableStream<Uint8Array<ArrayBufferLike>>;
