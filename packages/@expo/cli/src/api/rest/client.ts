import type { JSONValue } from '@expo/json-file';
import path from 'path';

import { wrapFetchWithCache } from './cache/wrapFetchWithCache';
import type { FetchLike } from './client.types';
import { wrapFetchWithBaseUrl } from './wrapFetchWithBaseUrl';
import { wrapFetchWithOffline } from './wrapFetchWithOffline';
import { wrapFetchWithProgress } from './wrapFetchWithProgress';
import { wrapFetchWithProxy } from './wrapFetchWithProxy';
import { wrapFetchWithUserAgent } from './wrapFetchWithUserAgent';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { fetch } from '../../utils/fetch';
import { getExpoApiBaseUrl } from '../endpoint';
import { disableNetwork } from '../settings';
import { getAccessToken, getExpoHomeDirectory, getSession } from '../user/UserSettings';

export class ApiV2Error extends Error {
  readonly name = 'ApiV2Error';
  readonly code: string;
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
    this.code = response.code;
    this.expoApiV2ErrorCode = response.code;
    this.expoApiV2ErrorDetails = response.details;
    this.expoApiV2ErrorServerStack = response.stack;
    this.expoApiV2ErrorMetadata = response.metadata;
  }
}

/**
 * An Expo server error that didn't return the expected error JSON information.
 * The only 'expected' place for this is in testing, all other cases are bugs with the server.
 */
export class UnexpectedServerError extends Error {
  readonly name = 'UnexpectedServerError';
}

/**
 * An error defining that the server didn't return the expected error JSON information.
 * The only 'expected' place for this is in testing, all other cases are bugs with the client.
 */
export class UnexpectedServerData extends Error {
  readonly name = 'UnexpectedServerData';
}

/** Validate the response json contains `.data` property, or throw an unexpected server data error */
export function getResponseDataOrThrow<T = any>(json: unknown): T {
  if (!!json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  throw new UnexpectedServerData(
    !!json && typeof json === 'object' ? JSON.stringify(json) : 'Unknown data received from server.'
  );
}

/**
 * @returns a `fetch` function that will inject user authentication information and handle errors from the Expo API.
 */
export function wrapFetchWithCredentials(fetchFunction: FetchLike): FetchLike {
  return async function fetchWithCredentials(url, options = {}) {
    if (Array.isArray(options.headers)) {
      throw new Error('request headers must be in object form');
    }

    const resolvedHeaders = options.headers ?? ({} as any);

    const token = getAccessToken();
    if (token) {
      resolvedHeaders.authorization = `Bearer ${token}`;
    } else {
      const sessionSecret = getSession()?.sessionSecret;
      if (sessionSecret) {
        resolvedHeaders['expo-session'] = sessionSecret;
      }
    }

    try {
      const response = await fetchFunction(url, {
        ...options,
        headers: resolvedHeaders,
      });

      // Handle expected API errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const body = await response.text();
        try {
          const data = JSON.parse(body);
          if (data?.errors?.length) {
            throw new ApiV2Error(data.errors[0]);
          }
        } catch (error: any) {
          // Server returned non-json response.
          if (error.message.includes('in JSON at position')) {
            throw new UnexpectedServerError(body);
          }
          throw error;
        }
      }

      return response;
    } catch (error: any) {
      // When running `expo start`, but wifi or internet has issues
      if (
        isNetworkError(error) || // node-fetch error handling
        ('cause' in error && isNetworkError(error.cause)) // undici error handling
      ) {
        disableNetwork();

        throw new CommandError(
          'OFFLINE',
          'Network connection is unreliable. Try again with the environment variable `EXPO_OFFLINE=1` to skip network requests.'
        );
      }

      throw error;
    }
  };
}

/**
 * Determine if the provided error is related to a network issue.
 * When this returns true, offline mode should be enabled.
 *   - `ENOTFOUND` is thrown when the DNS lookup failed
 *   - `UND_ERR_CONNECT_TIMEOUT` is thrown after DNS is resolved, but server can't be reached
 *
 * @see https://nodejs.org/api/errors.html
 * @see https://github.com/nodejs/undici#network-address-family-autoselection
 */
function isNetworkError(error: Error & { code?: string }) {
  return (
    'code' in error && error.code && ['ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT'].includes(error.code)
  );
}

const fetchWithOffline = wrapFetchWithOffline(wrapFetchWithUserAgent(fetch));

const fetchWithBaseUrl = wrapFetchWithBaseUrl(fetchWithOffline, getExpoApiBaseUrl() + '/v2/');

const fetchWithProxy = wrapFetchWithProxy(fetchWithBaseUrl);

const fetchWithCredentials = wrapFetchWithProgress(wrapFetchWithCredentials(fetchWithProxy));

/**
 * Create an instance of the fully qualified fetch command (auto authentication and api) but with caching in the '~/.expo' directory.
 * Caching is disabled automatically if the EXPO_NO_CACHE or EXPO_BETA environment variables are enabled.
 */
export function createCachedFetch({
  fetch = fetchWithCredentials,
  cacheDirectory,
  ttl,
  skipCache,
}: {
  fetch?: FetchLike;
  cacheDirectory: string;
  ttl?: number;
  skipCache?: boolean;
}): FetchLike {
  // Disable all caching in EXPO_BETA.
  if (skipCache || env.EXPO_BETA || env.EXPO_NO_CACHE) {
    return fetch;
  }

  const { FileSystemResponseCache } =
    require('./cache/FileSystemResponseCache') as typeof import('./cache/FileSystemResponseCache');

  return wrapFetchWithCache(
    fetch,
    new FileSystemResponseCache({
      cacheDirectory: path.join(getExpoHomeDirectory(), cacheDirectory),
      ttl,
    })
  );
}

/** Instance of fetch with automatic base URL pointing to the Expo API, user credential injection, and API error handling. Caching not included.  */
export const fetchAsync = wrapFetchWithProgress(wrapFetchWithCredentials(fetchWithProxy));
