import { FetchLike } from './client.types';
import { env } from '../../utils/env';

const debug = require('debug')('expo:api:fetch:offline') as typeof console.log;

/** Wrap fetch with support for `EXPO_OFFLINE` to disable network requests. */
export function wrapFetchWithOffline(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithOffline(url, options = {}) {
    if (env.EXPO_OFFLINE) {
      debug('Skipping network request: ' + url);
      options.timeout = 1;
    }
    return fetchFunction(url, options);
  };
}
