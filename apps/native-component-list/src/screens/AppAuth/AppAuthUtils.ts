import {
  AuthorizationResponse,
  AuthorizationNotifier,
  AuthorizationRequest,
  AuthorizationError,
  TokenResponse,
} from '@openid/appauth';
import * as AppAuth from 'expo-app-auth';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, Platform } from 'react-native';

export function tokenExpirationTimeLeft({
  expiresIn = 0,
  issuedAt = 0,
}: Pick<TokenResponse, 'expiresIn' | 'issuedAt'>): number {
  // Time is returned in seconds
  return (Date.now() - (expiresIn + issuedAt * 1000)) / 1000;
}

export function expiresInString({
  expiresIn = 0,
  issuedAt = 0,
}: Pick<TokenResponse, 'expiresIn' | 'issuedAt'>): string {
  // Time is returned in seconds, convert to milliseconds
  const date = expiresIn + issuedAt * 1000;
  return new Date(date).toLocaleTimeString();
}

export function useQueryParams(): Record<string, string> | null {
  const [queryParams, setQueryParams] = React.useState<Record<string, string> | null>(null);
  const link = useLinking();
  React.useEffect(() => {
    if (link) {
      const params = AppAuth.ExpoRequestHandler.getQueryParams(link);
      setQueryParams(params);
    } else {
      setQueryParams(null);
    }
  }, [link]);

  return queryParams;
}

function useAuthCodeQueryParam(): string | null {
  const queryParams = useQueryParams();
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCode(queryParams?.code ?? null);
  }, [queryParams]);

  return code;
}

export type AuthState = {
  response: AuthorizationResponse | null;
  error: AuthorizationError | null;
  request: AuthorizationRequest;
};

export function useRedirectCompleteAuth(): {
  authState: AuthState | null;
} {
  const [authState, setAuthState] = React.useState<AuthState | null>(null);
  const queryParams = useQueryParams();

  const handler = React.useMemo(() => {
    const handler = new AppAuth.ExpoRequestHandler();
    const notifier = new AuthorizationNotifier();
    handler.setAuthorizationNotifier(notifier);
    notifier.setAuthorizationListener((request, response, error) => {
      setAuthState({ request, response, error });
    });
    return handler;
  }, []);

  React.useEffect(() => {
    if (handler && queryParams?.code) {
      handler.completeAuthorizationRequestIfPossible();
    }
  }, [handler, queryParams?.code]);

  return { authState };
}

export function useRedirectAutoExchange(
  issuerOrServiceConfig: string | AppAuth.ExpoAuthorizationServiceConfigurationJson
): { code: string | null; token: TokenResponse | null; error: AuthorizationError | null } {
  const { authState } = useRedirectCompleteAuth();
  const [token, setToken] = React.useState<TokenResponse | null>(null);
  const [error, setError] = React.useState<AuthorizationError | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (token || !authState || loading) return;

    const { request, response, error } = authState;

    if (!response) {
      setError(error);
      return;
    }
    setLoading(true);

    AppAuth.exchangeAsync(
      {
        clientId: request.clientId,
        redirectUri: request.redirectUri,
        code: response.code,
        clientSecret: request.extras?.client_secret,
        codeVerifier: request.internal?.code_verifier,
      },
      issuerOrServiceConfig
    )
      .then(token => {
        setToken(token);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [loading, authState?.response?.code]);

  return {
    code: authState?.response?.code ?? null,
    token,
    error,
  };
}

export function clearQueryParams() {
  if (Platform.OS !== 'web') return;
  // Get the full URL.
  const currURL = window.location.href;

  const url = new URL(currURL);
  // Append the pathname to the origin (i.e. without the search).
  const nextUrl = url.origin + url.pathname;

  // Here you pass the new URL extension you want to appear after the domains '/'. Note that the previous identifiers or "query string" will be replaced.
  window.history.pushState({}, document.title, nextUrl);
}

/// Number of seconds the access token is refreshed before it actually expires.
const kExpiryTimeTolerance = 60;

export function useLinking(): string | null {
  const [link, setLink] = React.useState<string | null>(null);

  function onChange({ url }: { url: string | null }) {
    setLink(url);
  }

  React.useEffect(() => {
    Linking.getInitialURL().then(url => setLink(url));
    Linking.addEventListener('url', onChange);
    return () => {
      Linking.removeEventListener('url', onChange);
    };
  }, []);

  return link;
}

export function useParentNotifier(url: string) {
  const link = useLinking();

  React.useEffect(() => {
    console.log('url >>>', url);
    if (link === url) {
      // get the URL parameters which will include the auth token
      const params = window.location.search;
      if (window.opener) {
        // send them to the opening window
        window.opener.postMessage(params);
        // close the popup
        window.close();
      }
    }
  }, [link]);
}

export function usePrepareWebBrowser(): string | null {
  const [browser, setBrowser] = React.useState<string | null>(null);

  // Warm browser on Android
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.getCustomTabsSupportingBrowsersAsync().then(value => {
        if (value.browserPackages.length) {
          WebBrowser.warmUpAsync(value.browserPackages[0]).then(() => {
            setBrowser(value.browserPackages[0]);
          });
        }
      });
    }
    return () => {
      if (Platform.OS === 'android' && browser) {
        WebBrowser.coolDownAsync(browser);
      }
    };
  }, []);

  return browser;
}

// Determines whether a token refresh request must be made to refresh the tokens
export function isTokenFresh(
  token: Pick<TokenResponse, 'expiresIn' | 'issuedAt' | 'accessToken'>
): boolean {
  if (!token) {
    return false;
  }
  if (!token.expiresIn) {
    // if there is no expiration time but we have an access token, it is assumed to never expire
    return !!token.accessToken;
  }

  const timeLeft = tokenExpirationTimeLeft(token);
  return timeLeft > kExpiryTimeTolerance;
}

export function shouldRefreshTokensAsync(token: null | TokenResponse): boolean {
  if (!token || isTokenFresh(token)) {
    return false;
  }

  if (!token.refreshToken) {
    // no refresh token available and token has expired
    return false;
  }

  return true;
}

export async function getUserInfoAsync(
  token: TokenResponse,
  issuerOrServiceConfig: any
): Promise<Record<string, any>> {
  if (!token) {
    throw new Error('Cannot get user info without a valid access token');
  }
  const serviceConfig = await AppAuth.resolveServiceConfigAsync(issuerOrServiceConfig);
  // @ts-ignore: TODO
  const userInfoEndpoint = serviceConfig.discoveryDocument.userinfo_endpoint;

  if (!userInfoEndpoint) {
    throw new Error('User info endpoint is not declared in the service config discovery document');
  }

  const response = await fetch(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  const data = await response.json();

  if (response.status !== 200) {
    // server replied with an error
    if (response.status === 401) {
      // "401 Unauthorized" generally indicates there is an issue with the authorization
      // grant.
      // throw new Error(data)
      // log error
      throw new Error(`Authorization Error. Response: ${data}`);
    }
    throw new Error(`HTTP: ${response.status}. Response: ${data}`);
  }
  return data;
}

const serviceConfigCache: Record<string, AppAuth.ExpoAuthorizationServiceConfiguration> = {};
