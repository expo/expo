// import createHttpsProxyAgent from 'https-proxy-agent';

import { FetchLike } from './client.types';
import { env } from '../../utils/env';

const debug = require('debug')('expo:api:fetch:proxy') as typeof console.log;

/** Wrap fetch with support for proxies. */
export function wrapFetchWithProxy(fetchFunction: FetchLike): FetchLike {
  // NOTE(EvanBacon): DO NOT RETURN AN ASYNC WRAPPER. THIS BREAKS LOADING INDICATORS.
  return function fetchWithProxy(url, options = {}) {
    const proxy = env.HTTP_PROXY;
    if (!(options as any).agent && proxy) {
      debug('Using proxy:', proxy);
      // NOTE(cedric): This isn't possible with the built-in fetch API.
      // For this specific feature we could swap to undici instead as it supports `Agent`.
      // See: https://github.com/TooTallNate/proxy-agents/issues/239
      throw new Error('Proxy support is not implemented for the built-in fetch API');

      // options.agent = createHttpsProxyAgent(proxy);
    }
    return fetchFunction(url, options);
  };
}
