import { URL } from 'url';

import { FetchLike } from './client.types';

/**
 * Wrap a fetch function with support for a predefined base URL.
 * This implementation works like the browser fetch, applying the input to a prefix base URL.
 */
export function wrapFetchWithBaseUrl(fetch: FetchLike, baseUrl: string): FetchLike {
  return (url, init) => {
    if (typeof url !== 'string') {
      throw new TypeError('Custom fetch function only accepts a string URL as the first parameter');
    }
    const parsed = new URL(url, baseUrl);
    if (init?.searchParams) {
      parsed.search = init.searchParams.toString();
    }
    return fetch(parsed.toString(), init);
  };
}
