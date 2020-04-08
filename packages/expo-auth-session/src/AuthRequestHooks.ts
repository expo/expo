import { useEffect, useState } from 'react';

import { AuthRequest, AuthRequestConfig } from './AuthRequest';
import { Discovery, IssuerOrDiscovery, resolveDiscoveryAsync } from './Discovery';
import { Headers, requestAsync } from './Fetch';

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

export function useAuthRequest(
  config: AuthRequestConfig,
  discovery: Discovery | null
): AuthRequest | null {
  const [request, setRequest] = useState<AuthRequest | null>(null);

  useEffect(() => {
    if (config && discovery) {
      AuthRequest.buildAsync(
        {
          ...config,
        },
        discovery
      ).then(request => setRequest(request));
    }
  }, [
    discovery?.authorizationEndpoint,
    config.clientId,
    config.redirectUri,
    config.scopes.join(','),
    config.clientSecret,
    config.codeChallenge,
    config.state,
    JSON.stringify(config.extraParams || {}),
    config.usePKCE,
  ]);

  return request;
}
