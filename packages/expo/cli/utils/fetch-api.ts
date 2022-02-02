import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import { JSONValue } from '@expo/json-file';
import fetchInstance, { RequestInfo, RequestInit, Response } from 'node-fetch';
import path from 'path';
import { URL, URLSearchParams } from 'url';

import { EXPO_BETA, EXPO_LOCAL, EXPO_NO_CACHE, EXPO_STAGING } from './env';
import { FileSystemCache } from './fetch-cache/FileSystemCache';
import createFetchWithCache from './fetch-cache/fetch';
import { getAccessToken, getSessionSecret } from './user/sessionStorage';

export type FetchLike = (
  url: RequestInfo,
  init?: RequestInit & { searchParams?: URLSearchParams }
) => Promise<Response>;

export class ApiV2Error extends Error {
  readonly name = 'ApiV2Error';
  readonly expoApiV2ErrorCode: string;
  readonly expoApiV2ErrorDetails?: JSONValue;
  readonly expoApiV2ErrorServerStack?: string;
  readonly expoApiV2ErrorMetadata?: object;

  constructor(response: {
    message: string;
    code: string;
    stack?: string;
    details?: JSONValue;
    metadata?: object;
  }) {
    super(response.message);
    this.expoApiV2ErrorCode = response.code;
    this.expoApiV2ErrorDetails = response.details;
    this.expoApiV2ErrorServerStack = response.stack;
    this.expoApiV2ErrorMetadata = response.metadata;
  }
}

export function createFetchWithCredentials(fetchFunction: FetchLike): FetchLike {
  return async function fetchWithCredentials(url, options = {}) {
    if (Array.isArray(options.headers)) {
      throw new Error('request headers must be in object form');
    }

    const resolvedHeaders = options.headers || ({} as any);

    const token = getAccessToken();
    if (token) {
      resolvedHeaders.authorization = `Bearer ${token}`;
    } else {
      const sessionSecret = getSessionSecret();
      if (sessionSecret) {
        resolvedHeaders['expo-session'] = sessionSecret;
      }
    }

    const results = await fetchFunction(url, {
      ...options,
      headers: resolvedHeaders,
    });
    if (results.status === 400) {
      const data = await results.json();
      if (data?.errors?.length) {
        throw new ApiV2Error(data.errors[0]);
      }
    }
    return results;
  };
}

function createFetchAbsolute(fetch: FetchLike, baseUrl: string): FetchLike {
  return (url, init) => {
    if (typeof url === 'string') {
      const parsed = new URL(baseUrl + url);

      if (init.searchParams) {
        parsed.search = init.searchParams.toString();
      }
      return fetch(parsed.toString(), init);
    }
    return fetch(url, init);
  };
}

const fetchWithBaseUrl = createFetchAbsolute(fetchInstance, getExpoApiBaseUrl() + '/v2');

const fetchWithCredentials = createFetchWithCredentials(fetchWithBaseUrl);

export function createCachedFetch({
  fetch,
  cacheDirectory,
  ttl,
}: {
  fetch?: FetchLike;
  cacheDirectory: string;
  ttl?: number;
}): FetchLike {
  // Disable all caching in EXPO_BETA.
  if (EXPO_BETA || EXPO_NO_CACHE()) {
    return fetch ?? fetchWithCredentials;
  }

  return createFetchWithCache(
    fetch ?? fetchWithCredentials,
    new FileSystemCache({
      cacheDirectory: path.join(getExpoHomeDirectory(), cacheDirectory),
      ttl,
    })
  );
}

// export const fetch = fetchWithBaseUrl;
export const fetch = fetchWithCredentials;

export function getExpoApiBaseUrl(): string {
  if (EXPO_STAGING) {
    return `https://staging-api.expo.dev`;
  } else if (EXPO_LOCAL) {
    return `http://127.0.0.1:3000`;
  } else {
    return `https://api.expo.dev`;
  }
}
