import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'expo-modules-core';
import {
  dismissAuthSession,
  openAuthSessionAsync,
  WebBrowserAuthSessionResult,
} from 'expo-web-browser';

import { AuthRequest } from './AuthRequest';
import {
  AuthRequestConfig,
  AuthRequestPromptOptions,
  CodeChallengeMethod,
  Prompt,
  ResponseType,
} from './AuthRequest.types';
import {
  AuthSessionOptions,
  AuthSessionRedirectUriOptions,
  AuthSessionResult,
} from './AuthSession.types';
import {
  DiscoveryDocument,
  fetchDiscoveryAsync,
  Issuer,
  IssuerOrDiscovery,
  ProviderMetadata,
  resolveDiscoveryAsync,
} from './Discovery';
import { generateHexStringAsync } from './PKCE';
import { getQueryParams } from './QueryParams';
import sessionUrlProvider from './SessionUrlProvider';

let _authLock = false;

// @needsAudit
/**
 * Initiate a proxied authentication session with the given options. Only one `AuthSession` can be active at any given time in your application.
 * If you attempt to open a second session while one is still in progress, the second session will return a value to indicate that `AuthSession` is locked.
 *
 * @param options An object of type `AuthSessionOptions`.
 * @return Returns a Promise that resolves to an `AuthSessionResult` object.
 */
export async function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult> {
  const authUrl = options.authUrl;
  // Prevent accidentally starting to an empty url
  if (!authUrl) {
    throw new Error(
      'No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.'
    );
  }
  // Prevent multiple sessions from running at the same time, WebBrowser doesn't
  // support it this makes the behavior predictable.
  if (_authLock) {
    if (__DEV__) {
      console.warn(
        'Attempted to call AuthSession.startAsync multiple times while already active. Only one AuthSession can be active at any given time.'
      );
    }

    return { type: 'locked' };
  }

  const returnUrl = options.returnUrl || sessionUrlProvider.getDefaultReturnUrl();
  const startUrl = sessionUrlProvider.getStartUrl(authUrl, returnUrl, options.projectNameForProxy);
  const showInRecents = options.showInRecents || false;

  // About to start session, set lock
  _authLock = true;

  let result: WebBrowserAuthSessionResult;
  try {
    result = await _openWebBrowserAsync(startUrl, returnUrl, showInRecents);
  } finally {
    // WebBrowser session complete, unset lock
    _authLock = false;
  }

  // Handle failures
  if (!result) {
    throw new Error('Unexpected missing AuthSession result');
  }
  if (!('url' in result)) {
    if ('type' in result) {
      return result;
    } else {
      throw new Error('Unexpected AuthSession result with missing type');
    }
  }

  const { params, errorCode } = getQueryParams(result.url);

  return {
    type: errorCode ? 'error' : 'success',
    params,
    errorCode,
    authentication: null,
    url: result.url,
  };
}

// @needsAudit
/**
 * Cancels an active `AuthSession` if there is one. No return value, but if there is an active `AuthSession`
 * then the Promise returned by the `AuthSession.startAsync()` that initiated it resolves to `{ type: 'dismiss' }`.
 */
export function dismiss() {
  dismissAuthSession();
}

export const getDefaultReturnUrl = sessionUrlProvider.getDefaultReturnUrl;

// @needsAudit @docsMissing
/**
 * Get the URL that your authentication provider needs to redirect to. For example: `https://auth.expo.io/@your-username/your-app-slug`. You can pass an additional path component to be appended to the default redirect URL.
 * > **Note** This method will throw an exception if you're using the bare workflow on native.
 *
 * @param path
 * @return
 *
 * @example
 * ```ts
 * const url = AuthSession.getRedirectUrl('redirect');
 *
 * // Managed: https://auth.expo.io/@your-username/your-app-slug/redirect
 * // Web: https://localhost:19006/redirect
 * ```
 *
 * @deprecated Use `makeRedirectUri({ path, useProxy })` instead.
 */
export function getRedirectUrl(path?: string): string {
  return sessionUrlProvider.getRedirectUrl({ urlPath: path });
}

// @needsAudit
/**
 * Create a redirect url for the current platform and environment. You need to manually define the redirect that will be used in
 * a bare workflow React Native app, or an Expo standalone app, this is because it cannot be inferred automatically.
 * - **Web:** Generates a path based on the current `window.location`. For production web apps, you should hard code the URL as well.
 * - **Managed workflow:** Uses the `scheme` property of your `app.config.js` or `app.json`.
 *   - **Proxy:** Uses `auth.expo.io` as the base URL for the path. This only works in Expo Go and standalone environments.
 * - **Bare workflow:** Will fallback to using the `native` option for bare workflow React Native apps.
 *
 * @param options Additional options for configuring the path.
 * @return The `redirectUri` to use in an authentication request.
 *
 * @example
 * ```ts
 * const redirectUri = makeRedirectUri({
 *   scheme: 'my-scheme',
 *   path: 'redirect'
 * });
 * // Development Build: my-scheme://redirect
 * // Expo Go: exp://127.0.0.1:19000/--/redirect
 * // Web dev: https://localhost:19006/redirect
 * // Web prod: https://yourwebsite.com/redirect
 *
 * const redirectUri2 = makeRedirectUri({
 *   scheme: 'scheme2',
 *   preferLocalhost: true,
 *   isTripleSlashed: true,
 * });
 * // Development Build: scheme2:///
 * // Expo Go: exp://localhost:19000
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 *
 * const redirectUri3 = makeRedirectUri({
 *   useProxy: true,
 * });
 * // Development Build: https://auth.expo.io/@username/slug
 * // Expo Go: https://auth.expo.io/@username/slug
 * // Web dev: https://localhost:19006
 * // Web prod: https://yourwebsite.com
 * ```
 */
export function makeRedirectUri({
  native,
  scheme,
  isTripleSlashed,
  queryParams,
  path,
  preferLocalhost,
  useProxy,
  projectNameForProxy,
}: AuthSessionRedirectUriOptions = {}): string {
  if (
    Platform.OS !== 'web' &&
    native &&
    [ExecutionEnvironment.Standalone, ExecutionEnvironment.Bare].includes(
      Constants.executionEnvironment
    )
  ) {
    // Should use the user-defined native scheme in standalone builds
    return native;
  }
  if (!useProxy || Platform.OS === 'web') {
    const url = Linking.createURL(path || '', {
      isTripleSlashed,
      scheme,
      queryParams,
    });

    if (preferLocalhost) {
      const ipAddress = url.match(
        /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
      );
      // Only replace if an IP address exists
      if (ipAddress?.length) {
        const [protocol, path] = url.split(ipAddress[0]);
        return `${protocol}localhost${path}`;
      }
    }

    return url;
  }
  // Attempt to use the proxy
  return sessionUrlProvider.getRedirectUrl({ urlPath: path, projectNameForProxy });
}

// @needsAudit
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config A valid [`AuthRequestConfig`](#authrequestconfig) that specifies what provider to use.
 * @param issuerOrDiscovery A loaded [`DiscoveryDocument`](#discoverydocument) or issuer URL.
 * (Only `authorizationEndpoint` is required for requesting an authorization code).
 * @return Returns an instance of `AuthRequest` that can be used to prompt the user for authorization.
 */
export async function loadAsync(
  config: AuthRequestConfig,
  issuerOrDiscovery: IssuerOrDiscovery
): Promise<AuthRequest> {
  const request = new AuthRequest(config);
  const discovery = await resolveDiscoveryAsync(issuerOrDiscovery);
  await request.makeAuthUrlAsync(discovery);
  return request;
}

async function _openWebBrowserAsync(startUrl: string, returnUrl: string, showInRecents: boolean) {
  const result = await openAuthSessionAsync(startUrl, returnUrl, { showInRecents });
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { type: result.type };
  }

  return result;
}

export { useAutoDiscovery, useAuthRequest } from './AuthRequestHooks';
export { AuthError, TokenError } from './Errors';

export {
  AuthSessionOptions,
  AuthSessionRedirectUriOptions,
  AuthSessionResult,
  AuthRequest,
  AuthRequestConfig,
  AuthRequestPromptOptions,
  CodeChallengeMethod,
  DiscoveryDocument,
  Issuer,
  IssuerOrDiscovery,
  Prompt,
  ProviderMetadata,
  ResponseType,
  resolveDiscoveryAsync,
  fetchDiscoveryAsync,
  generateHexStringAsync,
};

export {
  // Token classes
  TokenResponse,
  AccessTokenRequest,
  RefreshTokenRequest,
  RevokeTokenRequest,
  // Token methods
  revokeAsync,
  refreshAsync,
  exchangeCodeAsync,
  fetchUserInfoAsync,
} from './TokenRequest';

// Token types
export * from './TokenRequest.types';

// Provider specific types
export { GoogleAuthRequestConfig } from './providers/Google';
export { FacebookAuthRequestConfig } from './providers/Facebook';
