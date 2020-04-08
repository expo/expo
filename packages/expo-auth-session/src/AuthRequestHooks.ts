import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import {
  AuthRequest,
  AuthRequestConfig,
  clearQueryParams,
  maybeCompleteAuthRequestAfterRedirectAsync,
} from './AuthRequest';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery, resolveDiscoveryAsync } from './Discovery';
import { Headers, requestAsync } from './Fetch';
import * as QueryParams from './QueryParams';

export function useLinking(): string | null {
  const [link, setLink] = useState<string | null>(null);

  function onChange({ url }: { url: string | null }) {
    setLink(url);
  }

  useEffect(() => {
    Linking.getInitialURL().then(url => setLink(url));
    Linking.addEventListener('url', onChange);
    return () => {
      Linking.removeEventListener('url', onChange);
    };
  }, []);

  return link;
}

export function useQueryParams(): Record<string, string> | null {
  const [queryParams, setQueryParams] = useState<Record<string, string> | null>(null);
  const link = useLinking();
  useEffect(() => {
    if (link) {
      const { params } = QueryParams.getQueryParams(link);
      setQueryParams(params);
    } else {
      setQueryParams(null);
    }
  }, [link]);

  return queryParams;
}

export function useDiscovery(issuerOrDiscovery: IssuerOrDiscovery): Discovery | null {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    resolveDiscoveryAsync(issuerOrDiscovery).then(discovery => {
      setDiscovery(discovery);
    });
  }, [issuerOrDiscovery]);

  return discovery;
}

export function useJsonFetchRequest<T>(
  accessToken: string,
  requestUrl: string,
  headers: Headers,
  method: string = 'GET'
): [T | null, Error | null] {
  const [json, setJson] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (accessToken) {
      requestAsync<T>(requestUrl, {
        // @ts-ignore
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...headers,
        },
        method,
        dataType: 'json',
      })
        .then(json => {
          setJson(json);
          setError(null);
        })
        .catch(error => {
          setJson(null);
          setError(error);
        });
    }
  }, [accessToken]);

  return [json, error];
}

export function useCompleteRedirect(): AuthSessionResult | null {
  if (Platform.OS !== 'web') return null;

  const [authState, setAuthState] = useState<AuthSessionResult | null>(null);
  const link = useLinking();

  useEffect(() => {
    if (link)
      maybeCompleteAuthRequestAfterRedirectAsync(link).then(result => {
        if (result) {
          clearQueryParams();
          setAuthState(result);
        }
      });
  }, [link]);

  return authState;
}

export function useAuthRequest(config: AuthRequestConfig): AuthRequest | null {
  const [request, setRequest] = useState<AuthRequest | null>(null);

  useEffect(() => {
    if (config) {
      AuthRequest.buildAsync({
        ...config,
      }).then(request => setRequest(request));
    }
  }, [
    config.clientId,
    config.redirectUri,
    config.scopes.join(','),
    config.clientSecret,
    config.codeChallenge,
    config.state,
    JSON.stringify(config.extraParams || {}),
    config.usePKCE,
    JSON.stringify(config.discovery || {}),
    config.issuer,
  ]);

  return request;
}
