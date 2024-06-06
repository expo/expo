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

    // lock

    try {
      const response = await fetch(url, init);
      const cachedResponse = await cache.set(cacheKey, {
        body: response.body!, // TODO(cedric): check if this causes issues
        info: getResponseInfo(response),
      });

      if (!cachedResponse) {
        debug(`Failed to cache response for: ${url}`);
        await cache.remove(cacheKey);
        return response;
      }

      return new Response(cachedResponse.body, cachedResponse.info);
    } finally {
      // unlock
    }
  };
}
