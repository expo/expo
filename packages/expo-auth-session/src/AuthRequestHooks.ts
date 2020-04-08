import { useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';

import {
  maybeCompleteAuthRequestAfterRedirectAsync,
  AuthRequest,
  AuthRequestConfig,
} from './AuthRequest';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery, resolveDiscoveryAsync } from './Discovery';
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

export function clearQueryParams() {
  if (Platform.OS !== 'web') return;
  // Get the full URL.
  const currURL = window.location.href;

  const url = new window.URL(currURL);
  // Append the pathname to the origin (i.e. without the search).
  const nextUrl = url.origin + url.pathname;

  // Here you pass the new URL extension you want to appear after the domains '/'. Note that the previous identifiers or "query string" will be replaced.
  window.history.pushState({}, window.document.title, nextUrl);
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
      const authRequest = new AuthRequest({
        ...config,
      });
      authRequest.buildUrlAsync().then(() => setRequest(authRequest));
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
