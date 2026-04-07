/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { CrawlerOptions, CrawlResult } from '../../types';
export default function watchmanCrawl({ abortSignal, computeSha1, extensions, ignore, includeSymlinks, onStatus, perfLogger, previousState, rootDir, roots, }: CrawlerOptions): Promise<CrawlResult>;
