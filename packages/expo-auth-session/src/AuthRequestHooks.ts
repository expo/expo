import { useCallback, useMemo, useEffect, useState } from 'react';

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
    let isAllowed = true;
    resolveDiscoveryAsync(issuerOrDiscovery).then((discovery) => {
      if (isAllowed) {
        setDiscovery(discovery);
      }
    });

    return () => {
      isAllowed = false;
    };
  }, [issuerOrDiscovery]);

  return discovery;
}

export function useLoadedAuthRequest(
  config: AuthRequestConfig,
  discovery: DiscoveryDocument | null,
  AuthRequestInstance: typeof AuthRequest
): AuthRequest | null {
  const [request, setRequest] = useState<AuthRequest | null>(null);
  const scopeString = useMemo(() => config.scopes?.join(','), [config.scopes]);
  const extraParamsString = useMemo(
    () => JSON.stringify(config.extraParams || {}),
    [config.extraParams]
  );
  useEffect(
    () => {
      let isMounted = true;

      if (discovery) {
        const request = new AuthRequestInstance(config);
        request.makeAuthUrlAsync(discovery).then(() => {
          if (isMounted) {
            // @ts-ignore
            setRequest(request);
          }
        });
      }
      return () => {
        isMounted = false;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      discovery?.authorizationEndpoint,
      config.clientId,
      config.redirectUri,
      config.responseType,
      config.prompt,
      config.clientSecret,
      config.codeChallenge,
      config.state,
      config.usePKCE,
      scopeString,
      extraParamsString,
    ]
  );
  return request;
}

type PromptMethod = (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>;

export function useAuthRequestResult(
  request: AuthRequest | null,
  discovery: DiscoveryDocument | null,
  customOptions: AuthRequestPromptOptions = {}
): [AuthSessionResult | null, PromptMethod] {
  const [result, setResult] = useState<AuthSessionResult | null>(null);

  const promptAsync = useCallback(
    async ({ windowFeatures = {}, ...options }: AuthRequestPromptOptions = {}) => {
      if (!discovery || !request) {
        throw new Error('Cannot prompt to authenticate until the request has finished loading.');
      }
      const inputOptions = {
        ...customOptions,
        ...options,
        windowFeatures: {
          ...(customOptions.windowFeatures ?? {}),
          ...windowFeatures,
        },
      };
      const result = await request?.promptAsync(discovery, inputOptions);
      setResult(result);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request?.url, discovery?.authorizationEndpoint]
  );

  return [result, promptAsync];
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
  const request = useLoadedAuthRequest(config, discovery, AuthRequest);
  const [result, promptAsync] = useAuthRequestResult(request, discovery);
  return [request, result, promptAsync];
}
