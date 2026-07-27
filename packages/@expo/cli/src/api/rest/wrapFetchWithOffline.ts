import { env } from '../../utils/env';
import type { FetchLike } from './client.types';

/** Wrap fetch with support for `EXPO_OFFLINE` to disable network requests. */
export function wrapFetchWithOffline(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithOffline(url, options = {}) {
    if (env.EXPO_OFFLINE) {
      const abortController = new AbortController();
      abortController.abort();
      options.signal = abortController.signal;
    }
    return fetchFunction(url, options);
  };
}
