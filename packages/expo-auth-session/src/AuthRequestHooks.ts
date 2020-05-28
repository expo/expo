import { useCallback, useEffect, useState } from 'react';

import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, IssuerOrDiscovery, resolveDiscoveryAsync } from './Discovery';

/**
 * Fetch the discovery document from an OpenID Connect issuer.
 *
 * @param issuerOrDiscovery
 */
export function useAutoDiscovery(issuerOrDiscovery: IssuerOrDiscovery): DiscoveryDocument | null {
  const [discovery, setDiscovery] = useState<DiscoveryDocument | null>(null);

  useEffect(() => {
    resolveDiscoveryAsync(issuerOrDiscovery).then(discovery => {
      setDiscovery(discovery);
    });
  }, [issuerOrDiscovery]);

  return discovery;
}

/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(
  config: AuthRequestConfig,
  discovery: DiscoveryDocument | null
): [
  AuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const [request, setRequest] = useState<AuthRequest | null>(null);
  const [result, setResult] = useState<AuthSessionResult | null>(null);

  const promptAsync = useCallback(
    async (options: AuthRequestPromptOptions = {}) => {
      if (!discovery || !request) {
        throw new Error('Cannot prompt to authenticate until the request has finished loading.');
      }
      const result = await request?.promptAsync(discovery, options);
      setResult(result);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request?.url, discovery?.authorizationEndpoint]
  );

  useEffect(
    () => {
      if (discovery) {
        const request = new AuthRequest(config);
        request.makeAuthUrlAsync(discovery).then(() => setRequest(request));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      discovery?.authorizationEndpoint,
      config.clientId,
      config.redirectUri,
      config.prompt,
      config.scopes.join(','), // eslint-disable-line react-hooks/exhaustive-deps
      config.clientSecret,
      config.codeChallenge,
      config.state,
      JSON.stringify(config.extraParams || {}), // eslint-disable-line react-hooks/exhaustive-deps
      config.usePKCE,
    ]
  );

  return [request, result, promptAsync];
}
