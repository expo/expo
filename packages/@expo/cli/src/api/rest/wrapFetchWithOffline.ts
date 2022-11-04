import { APISettings } from '../settings';
import { FetchLike } from './client.types';

const debug = require('debug')('expo:api:fetch:offline') as typeof console.log;

/** Wrap fetch with support for APISettings offline mode. */
export function wrapFetchWithOffline(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithOffline(url, options = {}) {
    if (APISettings.isOffline) {
      debug('Skipping network request: ' + url);
      options.timeout = 1;
    }
    return fetchFunction(url, options);
  };
}
