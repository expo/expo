import { URL } from 'url';

import { validateUrl } from '../../utils/url';
import { FetchLike } from './client.types';

/**
 * Wrap a fetch function with support for a predefined base URL.
 * This implementation works like the browser fetch, expecting relative URLs to start with `/`.
 *
 * This impl is unlike the browser in that it will allow the base URL to have sub paths like `/v2`
 * whereas the browser would remove everything after the origin.
 *
 * If the provided URL is absolute, it will be used as-is and ignore the base URL.
 * If the first parameter of the fetch function is not a string, an assertion will be thrown.
 */
export function wrapFetchWithPrefixUrl(fetch: FetchLike, baseUrl: string): FetchLike {
  return (url, init) => {
    if (typeof url !== 'string') {
      throw new TypeError('Custom fetch function only accepts a string URL as the first parameter');
    }
    let parsed: URL;
    if (validateUrl(url)) {
      parsed = new URL(url);
    } else {
      parsed = new URL(baseUrl + url);
    }
    if (init.searchParams) {
      parsed.search = init.searchParams.toString();
    }
    return fetch(parsed.toString(), init);
  };
}
