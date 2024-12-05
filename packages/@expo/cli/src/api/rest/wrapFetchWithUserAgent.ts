import process from 'node:process';

import { FetchLike } from './client.types';

export function wrapFetchWithUserAgent(fetch: FetchLike): FetchLike {
  // Version is added in the build script
  const userAgent = `expo-cli/${process.env.__EXPO_VERSION}`;

  return (url, init = {}) => {
    init.headers ??= {};

    if (Array.isArray(init.headers)) {
      const header = init.headers.find(([name]) => name === 'User-Agent');
      if (header) {
        header[1] = `${header[1]}, ${userAgent}`;
      } else {
        init.headers.push(['User-Agent', userAgent]);
      }
    } else if (canAppendHeader(init.headers)) {
      init.headers.append('User-Agent', userAgent);
    } else if (typeof init.headers === 'object') {
      const headers = init.headers as Record<string, string | string[]>;
      if (Array.isArray(headers['User-Agent'])) {
        headers['User-Agent'].push(userAgent);
      } else if (headers['User-Agent']) {
        headers['User-Agent'] = `${headers['User-Agent']}, ${userAgent}`;
      } else {
        headers['User-Agent'] = userAgent;
      }
    }

    return fetch(url, init);
  };
}

function canAppendHeader(value: unknown): value is Headers {
  return (
    !!value &&
    typeof value === 'object' &&
    'append' in value &&
    typeof value['append'] === 'function'
  );
}
