import { useCallback, useEffect, useState } from 'react';

import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery, resolveDiscoveryAsync } from './Discovery';

export function useDiscovery(issuerOrDiscovery: IssuerOrDiscovery): Discovery | null {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);

  useEffect(() => {
    resolveDiscoveryAsync(issuerOrDiscovery).then(discovery => {
      setDiscovery(discovery);
    });
  }, [issuerOrDiscovery]);

  return discovery;
}

export function useAuthRequest(
  config: AuthRequestConfig,
  discovery: Discovery | null
): [
  AuthRequest | null,
  AuthSessionResult | null,
  (options: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const [request, setRequest] = useState<AuthRequest | null>(null);
  const [result, setResult] = useState<AuthSessionResult | null>(null);

  const promptAsync = useCallback(
    async (options: AuthRequestPromptOptions) => {
      if (!discovery || !request) {
        throw new Error('Cannot prompt to authenticate until the request has finished loading.');
      }
      console.log(request);
      const result = await request?.promptAsync(discovery, options);
      setResult(result);
      return result;
    },
    [request?.url, discovery?.authorizationEndpoint]
  );

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

  return [request, result, promptAsync];
}
