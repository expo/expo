import { GraphQLClient } from 'graphql-request';

import * as DevLauncherAuth from './native-modules/DevLauncherAuth';

const useStaging = __DEV__;

export const apiEndpoint = useStaging
  ? `https://staging.exp.host/--/graphql`
  : `https://exp.host/--/graphql`;
export const websiteOrigin = useStaging ? `https://staging.expo.dev` : 'https://expo.dev';
export const restEndpoint = useStaging
  ? `https://staging.exp.host/--/api/v2`
  : `https://exp.host/--/api/v2`;

export const apiClient = new GraphQLClient(apiEndpoint);

const headers = {
  'content-type': 'application/json',
};

export function restClient<T = any>(endpoint: string, options: RequestInit = {}) {
  const config = {
    method: options.body ? 'POST' : 'GET',
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  if (options.body != null) {
    // @ts-ignore
    config.body = JSON.stringify(body);
  }

  const url = `${restEndpoint}${endpoint}`;

  return fetch(url, config).then(async (response) => {
    if (response.ok) {
      return (await response.json()) as T;
    } else {
      const errorMessage = await response.text();
      return Promise.reject(new Error(errorMessage));
    }
  });
}

export async function setSessionAsync(session: string | null) {
  await DevLauncherAuth.setSessionAsync(session);
  apiClient.setHeader('expo-session', session);
  headers['expo-session'] = session;
}
