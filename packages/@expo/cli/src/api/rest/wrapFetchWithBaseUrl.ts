import { URL } from 'url';

import { FetchLike } from './client.types';

// const debug = require('debug')('expo:api:fetch:base') as typeof console.log;

/**
 * Wrap a fetch function with support for a predefined base URL.
 * This implementation works like the browser fetch, applying the input to a prefix base URL.
 */
export function wrapFetchWithBaseUrl(fetch: FetchLike, baseUrl: string): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return (url, init) => {
    if (typeof url !== 'string') {
      throw new TypeError('Custom fetch function only accepts a string URL as the first parameter');
    }
    const parsed = new URL(url, baseUrl);
    if (init?.searchParams) {
      parsed.search = init.searchParams.toString();
    }
    // debug('fetch:', parsed.toString().trim());
    return fetch(parsed.toString(), init);
  };
}
