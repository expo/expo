import createHttpsProxyAgent from 'https-proxy-agent';

import { FetchLike } from './client.types';
import { env } from '../../utils/env';

const debug = require('debug')('expo:api:fetch:proxy') as typeof console.log;

/** Wrap fetch with support for proxies. */
export function wrapFetchWithProxy(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithProxy(url, options = {}) {
    const proxy = env.HTTP_PROXY;
    if (!options.agent && proxy) {
      debug('Using proxy:', proxy);
      options.agent = createHttpsProxyAgent(proxy);
    }
    return fetchFunction(url, options);
  };
}
