/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadBundleAsync } from './loadBundle';

/**
 * Must satisfy the requirements of the Metro bundler.
 * https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0605-lazy-bundling.md#__loadbundleasync-in-metro
 */
type AsyncRequire = (path: string) => Promise<void>;

/** Create an `loadBundleAsync` function in the expected shape for Metro bundler. */
export function buildAsyncRequire(): AsyncRequire {
  const cache = new Map<string, Promise<void>>();

  return async function universal_loadBundleAsync(path: string): Promise<void> {
    if (cache.has(path)) {
      return cache.get(path)!;
    }

    const promise = loadBundleAsync(path).catch((error) => {
      cache.delete(path);
      throw error;
    });

    cache.set(path, promise);

    return promise;
  };
}
