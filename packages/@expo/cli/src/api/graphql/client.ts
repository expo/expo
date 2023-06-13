import {
  cacheExchange,
  Client,
  CombinedError as GraphqlError,
  createClient as createUrqlClient,
  dedupExchange,
  fetchExchange,
  OperationContext,
  OperationResult,
  PromisifiedSource,
  TypedDocumentNode,
} from '@urql/core';
import { retryExchange } from '@urql/exchange-retry';
import { DocumentNode } from 'graphql';
import fetch from 'node-fetch';

import * as Log from '../../log';
import { getExpoApiBaseUrl } from '../endpoint';
import { wrapFetchWithOffline } from '../rest/wrapFetchWithOffline';
import { wrapFetchWithProxy } from '../rest/wrapFetchWithProxy';
import UserSettings from '../user/UserSettings';

type AccessTokenHeaders = {
  authorization: string;
};

type SessionHeaders = {
  'expo-session': string;
};

export const graphqlClient = createUrqlClient({
  url: getExpoApiBaseUrl() + '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    retryExchange({
      maxDelayMs: 4000,
      retryIf: (err) =>
        !!(err && (err.networkError || err.graphQLErrors.some((e) => e?.extensions?.isTransient))),
    }),
    fetchExchange,
  ],
  // @ts-ignore Type 'typeof fetch' is not assignable to type '(input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>'.
  fetch: wrapFetchWithOffline(wrapFetchWithProxy(fetch)),
  fetchOptions: (): { headers?: AccessTokenHeaders | SessionHeaders } => {
    const token = UserSettings.getAccessToken();
    if (token) {
      return {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
    }
    const sessionSecret = UserSettings.getSession()?.sessionSecret;
    if (sessionSecret) {
      return {
        headers: {
          'expo-session': sessionSecret,
        },
      };
    }
    return {};
  },
}) as StricterClient;

/* Please specify additionalTypenames in your Graphql queries */
export interface StricterClient extends Client {
  // eslint-disable-next-line @typescript-eslint/ban-types
  query<Data = any, Variables extends object = {}>(
    query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
    variables: Variables | undefined,
    context: Partial<OperationContext> & { additionalTypenames: string[] }
  ): PromisifiedSource<OperationResult<Data, Variables>>;
}

export async function withErrorHandlingAsync<T>(promise: Promise<OperationResult<T>>): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    if (error.graphQLErrors.some((e) => e?.extensions?.isTransient)) {
      Log.error(`We've encountered a transient error, please try again shortly.`);
    }
    throw error;
  }

  // Check for a malformed response. This only checks the root query's existence. It doesn't affect
  // returning responses with an empty result set.
  if (!data) {
    throw new Error('Returned query result data is null!');
  }

  return data;
}

export { GraphqlError };
