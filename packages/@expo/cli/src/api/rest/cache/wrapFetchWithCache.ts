import { Response, type RequestInfo, type RequestInit } from 'undici';

import { getRequestCacheKey, getResponseInfo, type ResponseCache } from './ResponseCache';
import type { FetchLike } from '../client.types';

const debug = require('debug')('expo:undici-cache');

export function wrapFetchWithCache(fetch: FetchLike, cache: ResponseCache): FetchLike {
  return async function cachedFetch(url: RequestInfo, init?: RequestInit) {
    const cacheKey = getRequestCacheKey(url, init);
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      return new Response(cachedResponse.body, cachedResponse.info);
    }

    await lock(cacheKey);

    try {
      // Retry loading from cache, in case it was stored during the lock
      let cachedResponse = await cache.get(cacheKey);
      if (cachedResponse) {
        return new Response(cachedResponse.body, cachedResponse.info);
      }

      // Execute the fetch request
      const response = await fetch(url, init);
      if (!response.ok || !response.body) {
        return response;
      }

      // Cache the response
      cachedResponse = await cache.set(cacheKey, {
        body: response.body,
        info: getResponseInfo(response),
      });

      // Warn through debug logs that caching failed
      if (!cachedResponse) {
        debug(`Failed to cache response for: ${url}`);
        await cache.remove(cacheKey);
        return response;
      }

      // Return the cached response
      return new Response(cachedResponse.body, cachedResponse.info);
    } finally {
      unlock(cacheKey);
    }
  };
}

const lockPromiseForKey: Record<string, Promise<any>> = {};
const unlockFunctionForKey: Record<string, any> = {};

async function lock(key: string) {
  if (!lockPromiseForKey[key]) {
    lockPromiseForKey[key] = Promise.resolve();
  }

  const takeLockPromise = lockPromiseForKey[key];
  lockPromiseForKey[key] = takeLockPromise.then(
    () =>
      new Promise((fulfill) => {
        unlockFunctionForKey[key] = fulfill;
      })
  );

  return takeLockPromise;
}

function unlock(key: string) {
  if (unlockFunctionForKey[key]) {
    unlockFunctionForKey[key]();
    delete unlockFunctionForKey[key];
  }
}
