import {
  cacheExchange,
  Client,
  CombinedError as GraphqlError,
  AnyVariables,
  DocumentInput,
  createClient as createUrqlClient,
  fetchExchange,
  OperationContext,
  OperationResult,
  OperationResultSource,
} from '@urql/core';
import { retryExchange } from '@urql/exchange-retry';

import * as Log from '../../log';
import { fetch } from '../../utils/fetch';
import { getExpoApiBaseUrl } from '../endpoint';
import { wrapFetchWithOffline } from '../rest/wrapFetchWithOffline';
import { wrapFetchWithProxy } from '../rest/wrapFetchWithProxy';
import { wrapFetchWithUserAgent } from '../rest/wrapFetchWithUserAgent';
import { getAccessToken, getSession } from '../user/UserSettings';

type AccessTokenHeaders = {
  authorization: string;
};

type SessionHeaders = {
  'expo-session': string;
};

export const graphqlClient = createUrqlClient({
  url: getExpoApiBaseUrl() + '/graphql',
  exchanges: [
    cacheExchange,
    retryExchange({
      maxDelayMs: 4000,
      retryIf: (err) =>
        !!(err && (err.networkError || err.graphQLErrors.some((e) => e?.extensions?.isTransient))),
    }),
    fetchExchange,
  ],
  // @ts-ignore Type 'typeof fetch' is not assignable to type '(input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>'.
  fetch: wrapFetchWithOffline(wrapFetchWithProxy(wrapFetchWithUserAgent(fetch))),
  fetchOptions: (): { headers?: AccessTokenHeaders | SessionHeaders } => {
    const token = getAccessToken();
    if (token) {
      return {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
    }
    const sessionSecret = getSession()?.sessionSecret;
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
  query<Data = any, Variables extends AnyVariables = AnyVariables>(
    query: DocumentInput<Data, Variables>,
    variables: Variables,
    context: Partial<OperationContext> & { additionalTypenames: string[] }
  ): OperationResultSource<OperationResult<Data, Variables>>;
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
