/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NoopCacheManager } from '../NoopCacheManager';

describe('NoopCacheManager', () => {
  test('reads nothing', async () => {
    await expect(new NoopCacheManager().read()).resolves.toBeNull();
  });

  test('writes nothing', async () => {
    const cacheManager = new NoopCacheManager();
    await expect(cacheManager.write()).resolves.toBeUndefined();
    await expect(cacheManager.read()).resolves.toBeNull();
  });

  test('ends without error', async () => {
    await expect(new NoopCacheManager().end()).resolves.toBeUndefined();
  });
});
