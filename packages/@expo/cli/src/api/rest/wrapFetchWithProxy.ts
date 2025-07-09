import { EnvHttpProxyAgent } from 'undici';

import { FetchLike } from './client.types';
import { env } from '../../utils/env';

const debug = require('debug')('expo:api:fetch:proxy') as typeof console.log;

/** Wrap fetch with support for proxies. */
export function wrapFetchWithProxy(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithProxy(url, options = {}) {
    if (!options.dispatcher && env.HTTP_PROXY) {
      debug('Using proxy:', env.HTTP_PROXY);
      options.dispatcher = new EnvHttpProxyAgent();
    }

    return fetchFunction(url, options);
  };
}
