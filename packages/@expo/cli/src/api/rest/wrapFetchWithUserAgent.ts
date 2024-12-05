import process from 'node:process';

import { FetchLike } from './client.types';
import { Headers } from '../../utils/fetch';

export function wrapFetchWithUserAgent(fetch: FetchLike): FetchLike {
  return (url, init = {}) => {
    const headers = new Headers(init.headers);
    // Version is added in the build script
    headers.append('User-Agent', `expo-cli/${process.env.__EXPO_VERSION}`);
    init.headers = headers;
    return fetch(url, init);
  };
}
