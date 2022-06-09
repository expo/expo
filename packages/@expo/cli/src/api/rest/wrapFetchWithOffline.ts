import * as Log from '../../log';
import { APISettings } from '../settings';
import { FetchLike } from './client.types';

/** Wrap fetch with support for APISettings offline mode. */
export function wrapFetchWithOffline(fetchFunction: FetchLike): FetchLike {
  return async function fetchWithOffline(url, options = {}) {
    if (APISettings.isOffline) {
      Log.debug('[fetch] Offline: Skipping network request: ' + url);
      options.timeout = 1;
    }
    return fetchFunction(url, options);
  };
}
