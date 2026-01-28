import type { Response } from 'undici';

import * as Log from '../../log';
import { fetch } from '../../utils/fetch';
import { getExpoApiBaseUrl } from '../endpoint';
import {
  getResponseDataOrThrow,
  UnexpectedServerData,
  UnexpectedServerError,
} from '../rest/client';
import { FetchLike } from '../rest/client.types';
import { wrapFetchWithOffline } from '../rest/wrapFetchWithOffline';
import { wrapFetchWithProxy } from '../rest/wrapFetchWithProxy';
import { wrapFetchWithUserAgent } from '../rest/wrapFetchWithUserAgent';
import { getAccessToken, getSession } from '../user/UserSettings';

type JSONObject = Record<string, unknown>;
type EmptyVariables = Record<string, never>;

export type StaticDocumentNode<Result extends JSONObject, Variables extends JSONObject> = string & {
  readonly __graphql: (vars: Variables) => Result;
};

export function graphql<Result extends JSONObject, Variables extends JSONObject = EmptyVariables>(
  query: string
): StaticDocumentNode<Result, Variables> {
  return query.trim() as StaticDocumentNode<Result, Variables>;
}

export { UnexpectedServerError, UnexpectedServerData };

export interface QueryOptions {
  headers?: Record<string, string>;
}

export const query = (() => {
  const url = getExpoApiBaseUrl() + '/graphql';

  let _fetch: FetchLike | undefined;
  const wrappedFetch: FetchLike = (...args) => {
    if (!_fetch) {
      _fetch = wrapFetchWithOffline(wrapFetchWithProxy(wrapFetchWithUserAgent(fetch)));
    }
    return _fetch(...args);
  };

  const randomDelay = (attemptCount: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, Math.min(500 + Math.random() * 1000 * attemptCount, 4_000));
    });

  const getFetchHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/graphql-response+json, application/graphql+json, application/json',
    };
    let sessionSecret: string | undefined;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    } else if ((sessionSecret = getSession()?.sessionSecret)) {
      headers['expo-session'] = sessionSecret;
    }
    return headers;
  };

  // NOTE(@kitten): This only sorted keys one level deep since this is sufficient for most cases
  const stringifySorted = (variables: JSONObject): string =>
    JSON.stringify(
      Object.keys(variables)
        .sort()
        .reduce((acc, key) => {
          acc[key] = variables[key];
          return acc;
        }, {} as JSONObject)
    );

  let cache: Record<string, Map<string, unknown>> = {};
  let cacheKey: string | undefined;

  function resetCache() {
    cache = {};
  }

  return async function query<Result extends JSONObject, Variables extends JSONObject>(
    query: StaticDocumentNode<Result, Variables>,
    variables: Variables,
    options?: QueryOptions
  ): Promise<Result> {
    let isTransient = false;
    let response: Response | undefined;
    let data: Result | null | undefined;
    let error: unknown;

    // Pre-instantiate headers and reset the cache if they've changed
    const headers = { ...getFetchHeaders(), ...options?.headers };
    const headersKey = stringifySorted(headers);
    if (!cacheKey || cacheKey !== headersKey) {
      resetCache();
    }

    // Retrieve a cached result, if we have any via a `query => variables => Result` cache key
    const variablesKey = stringifySorted(variables);
    const queryCache = cache[query] || (cache[query] = new Map());
    if (queryCache.has(variablesKey)) {
      data = queryCache.get(variablesKey) as Result;
    }

    // Retry the query if it fails due to an unknown or transient error
    for (let attemptCount = 0; attemptCount < 3 && !data; attemptCount++) {
      // Add a random delay on each subsequent attempt
      if (attemptCount > 0) {
        await randomDelay(attemptCount);
      }

      try {
        response = await wrappedFetch(url, {
          ...options,
          method: 'POST',
          body: JSON.stringify({ query, variables }),
          headers,
        });
      } catch (networkError) {
        error = networkError || error;
        continue;
      }

      const json = await response.json();
      if (typeof json === 'object' && json) {
        // If we have a transient error, we retry immediately and discard the data
        // Otherwise, we store the first available error and get the data
        if ('errors' in json && Array.isArray(json.errors)) {
          isTransient = json.errors.some((e) => e?.extensions?.isTransient);
          if (isTransient) {
            data = undefined;
            continue;
          } else {
            error = json.errors[0] || error;
          }
        }

        try {
          data = getResponseDataOrThrow<Result | null>(json);
        } catch (dataError) {
          // We only use the data error, if we don't have an error already
          if (!error) {
            error = dataError || error;
          }
          continue;
        }
      }
    }

    // Store the data in the cache, and only return a result if we have any values
    if (data) {
      queryCache.set(variablesKey, data);
      const keys = Object.keys(data);
      if (keys.length > 0 && keys.some((key) => data[key as keyof typeof data] != null)) {
        return data;
      }
    }

    // If we have an error, rethrow it wrapped in our custom errors
    if (error) {
      if (isTransient) {
        Log.error(`We've encountered a transient error, please try again shortly.`);
      }
      const wrappedError = new UnexpectedServerError('' + (error as any).message);
      wrappedError.cause = error;
      throw wrappedError;
    } else if (response && !response.ok) {
      throw new UnexpectedServerError(`Unexpected server error: ${response.statusText}`);
    } else {
      throw new UnexpectedServerData('Unexpected server error: No returned query result');
    }
  };
})();
