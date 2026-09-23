/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { buildUrlForBundle } from './buildUrlForBundle';
import { loadBundleAsync } from './loadBundle';

/**
 * Must satisfy the requirements of the Metro bundler.
 * https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0605-lazy-bundling.md#__loadbundleasync-in-metro
 */
type AsyncRequire = ((path: string | readonly string[]) => Promise<void>) & {
  isReady?: (paths: readonly string[]) => boolean;
};

/** Create an `loadBundleAsync` function in the expected shape for Metro bundler. */
export function buildAsyncRequire(): AsyncRequire {
  const cache = new Map<string, Promise<void>>();
  const runtime = globalThis as typeof globalThis & Record<string, unknown>;
  // Keep any completions recorded before the loader was installed.
  const registryKey = `${runtime.__METRO_GLOBAL_PREFIX__ ?? ''}__expo_chunk_completion__`;
  const completedUrls =
    process.env.EXPO_OS === 'web' && process.env.NODE_ENV === 'production'
      ? ((runtime[registryKey] ??= new Set<string>()) as Set<string>)
      : undefined;
  const getCacheKey = (path: string): string => {
    if (!completedUrls) return path;
    const url = buildUrlForBundle(path);
    return typeof document === 'undefined' ? url : new URL(url, document.baseURI).href;
  };

  async function loadFileAsync(path: string, requireCompletion = false): Promise<void> {
    const cacheKey = getCacheKey(path);
    if (completedUrls?.has(cacheKey)) return;
    let promise = cache.get(cacheKey);
    if (!promise) {
      promise = loadBundleAsync(path).catch((error) => {
        if (cache.get(cacheKey) === promise) cache.delete(cacheKey);
        throw error;
      });
      cache.set(cacheKey, promise);
    }

    await promise;
    // A script can fire 'load' even if it threw before registering every module.
    if (requireCompletion && completedUrls && !completedUrls.has(cacheKey)) {
      if (cache.get(cacheKey) === promise) cache.delete(cacheKey);
      throw new Error(
        `Chunk ${cacheKey} did not finish registering its modules. ` +
          'Check the browser console for script errors, then retry loading the chunk.'
      );
    }
  }

  const load: AsyncRequire = async function universal_loadBundleAsync(path): Promise<void> {
    if (typeof path === 'string') return loadFileAsync(path);
    await Promise.all(path.map((file) => loadFileAsync(file, true)));
  };
  if (completedUrls)
    load.isReady = (paths) => paths.every((path) => completedUrls.has(getCacheKey(path)));
  return load;
}
