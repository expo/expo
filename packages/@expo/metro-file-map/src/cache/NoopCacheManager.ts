/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CacheData, CacheManager } from '../types';

/**
 * A `CacheManager` that never reads or writes.
 */
export class NoopCacheManager implements CacheManager {
  async read(): Promise<CacheData | null | undefined> {
    return null;
  }

  async write(): Promise<void> {}

  async end(): Promise<void> {}
}
