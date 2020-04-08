import * as WebBrowser from 'expo-web-browser';
import invariant from 'invariant';
import { Linking, Platform } from 'react-native';

import { AuthSessionResult } from './AuthSession.types';
import { Discovery, fetchDiscoveryAsync } from './Discovery';
import { AuthResponseError } from './Errors';
import * as PKCE from './PKCE';
import * as QueryParams from './QueryParams';
import { getSessionUrlProvider } from './SessionUrlProvider';
import * as Storage from './Storage';

const sessionUrlProvider = getSessionUrlProvider();

let _authLock: boolean = false;

export enum CodeChallengeMethod {
  S256 = 'S256',
  Plain = 'plain',
}

/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * https://tools.ietf.org/html/rfc6749#section-3.1.1
 */
export enum ResponseType {
  /**
   * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
   */
  Code = 'code',
  /**
   * for requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
   */
  Token = 'token',
}

export interface AuthRequestConfig {
  responseType: ResponseType;
  clientId: string;
  /**
   * https://tools.ietf.org/html/rfc6749#section-3.1.2
   */
  redirectUri: string;
  scopes: string[];
  clientSecret?: string;
  codeChallengeMethod: CodeChallengeMethod;
  codeChallenge?: string;
  state?: string;
  extraParams?: Record<string, string>;
  usePKCE?: boolean;
  discovery?: Discovery;
  issuer?: string;
}

export type AuthResponse = {
  code: string;
  state: string;
};

/**
 * Represents the authorization request.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export class AuthRequest {
  responseType: ResponseType;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  clientSecret?: string;
  extraParams: Record<string, string>;
  usePKCE?: boolean;
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod: CodeChallengeMethod;
  url: string | null = null;
  /**
   * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
   */
  state: Promise<string> | string;
  private issuer?: string;
  discovery?: Discovery;

  constructor(request: AuthRequestConfig) {
    this.responseType = request.responseType ?? ResponseType.Code;
    this.clientId = request.clientId;
    this.redirectUri = request.redirectUri;
    this.scopes = request.scopes;
    this.clientSecret = request.clientSecret;
    this.state = request.state ?? PKCE.generateRandomAsync(10);
    this.extraParams = request.extraParams ?? {};
    this.codeChallengeMethod = request.codeChallengeMethod ?? CodeChallengeMethod.S256;
    // PKCE defaults to true
    this.usePKCE = request.usePKCE ?? true;
    this.discovery = request.discovery;
    this.issuer = request.issuer;

    invariant(
      this.redirectUri,
      `\`AuthRequest\` requires a valid \`redirectUri\`. Ex: ${Platform.select({
        web: 'https://yourwebsite.com/',
        default: 'com.your.app:/oauthredirect',
      })}`
    );
  }

  public async getAuthRequestConfigAsync(): Promise<AuthRequestConfig> {
    if (this.usePKCE) {
      await this.ensureCodeIsSetupAsync();
    }

    return {
      issuer: this.issuer,
      discovery: await this.getDiscoveryAsync(),
      responseType: this.responseType,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scopes: this.scopes,
      clientSecret: this.clientSecret,
      codeChallenge: this.codeChallenge,
      codeChallengeMethod: this.codeChallengeMethod,
      state: await this.getStateAsync(),
      extraParams: this.extraParams,
      usePKCE: this.usePKCE,
    };
  }

  public async performAsync(options: {
    useProxy?: boolean;
    showInRecents?: boolean;
    useRedirect?: boolean;
  }): Promise<AuthSessionResult> {
    // Reuse the preloaded url
    const url = this.url ?? (await this.buildUrlAsync());
    return await this.performWithUrlAsync(url, options);
  }

  public async performWithUrlAsync(
    url: string,
    options: { useProxy?: boolean; showInRecents?: boolean; useRedirect?: boolean }
  ): Promise<AuthSessionResult> {
    // Prevent accidentally starting to an empty url
    if (!url) {
      throw new Error(
        'No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.'
      );
    }

    let startUrl: string = url;
    let returnUrl: string = this.redirectUri;
    if (options.useProxy) {
      returnUrl = sessionUrlProvider.getDefaultReturnUrl();
      startUrl = sessionUrlProvider.getStartUrl(url, returnUrl);
    }
    if (options.useRedirect && Platform.OS === 'web') {
      // Clear any prior auth request
      await this.deletePendingAuthRequestAsync();
      // Store the current discovery so we know which auth method is currently in progress
      await Storage.setItemAsync(
        getDiscoveryStorageKey(),
        getDiscoveryId(await this.getDiscoveryAsync())
      );
      // Cache the current auth request for rehydration when the page returns.
      await this.cacheAsync();
      // @ts-ignore: The page will change and the return value won't be used
      return Promise.resolve(window.location.assign(startUrl));
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

    // About to start session, set lock
    _authLock = true;

    let result: WebBrowser.WebBrowserAuthSessionResult;
    try {
      result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, {
        showInRecents: options.showInRecents,
      });
    } finally {
      _authLock = false;
    }

    if (result.type === 'opened') {
      // This should never happen
      throw new Error('An unexpected error occurred');
    }
    if (result.type !== 'success') {
      return { type: result.type };
    }

    return await this.parseReturnUrlAsync(result.url);
  }

  async parseReturnUrlAsync(url: string): Promise<AuthSessionResult> {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    const { state, error = errorCode } = params;
    const shouldNotify = state === this.state;

    if (Platform.OS === 'web') {
      const discovery = await this.getDiscoveryAsync();
      await deletePendingAuthRequestAsync(discovery);
    }

    if (!shouldNotify) {
      throw new Error('Cached state and returned state do not match.');
    } else if (error) {
      return {
        type: 'error',
        errorCode,
        error: new AuthResponseError({ error, ...params }),
        url,
        params,
      };
    }

    return {
      type: 'success',
      errorCode,
      error: null,
      url,
      params,
    };
  }

  public async buildUrlAsync(): Promise<string> {
    const request = await this.getAuthRequestConfigAsync();
    if (!request.state) throw new Error('Cannot build request without a valid `state` loaded');

    // build the query string
    // coerce to any type for convenience
    let params: Record<string, string> = {};
    if (request.codeChallenge) {
      params.code_challenge = request.codeChallenge;
    }
    if (request.codeChallengeMethod) {
      params.code_challenge_method = request.codeChallengeMethod;
    }
    if (request.clientSecret) {
      params.client_secret = request.clientSecret;
    }

    // copy over extra params
    for (const extra in request.extraParams) {
      if (extra in request.extraParams) {
        params[extra] = request.extraParams[extra];
      }
    }

    // These overwrite any extra params
    params = {
      ...params,
      redirect_uri: request.redirectUri,
      client_id: request.clientId,
      response_type: request.responseType,
      state: request.state,
      scope: request.scopes.join(' '),
    };

    const query = QueryParams.buildQueryString(params);
    const discovery = await this.getDiscoveryAsync();
    this.url = `${discovery.authorizationEndpoint}?${query}`;
    return this.url;
  }

  private async getStateAsync(): Promise<string> {
    if (this.state instanceof Promise) this.state = await this.state;
    return this.state;
  }

  public async getDiscoveryAsync(): Promise<Discovery> {
    if (!this.discovery) {
      if (this.issuer) {
        this.discovery = await fetchDiscoveryAsync(this.issuer);
      } else {
        throw new Error(
          'AuthRequest requires either a discovery or issuer but neither were provided.'
        );
      }
    }
    return this.discovery;
  }

  private async cacheAsync(): Promise<void> {
    if (Platform.OS !== 'web') return;
    const discovery = await this.getDiscoveryAsync();
    const discoveryId = getDiscoveryId(discovery);
    const storageKey = getStorageKey(discoveryId);
    const existingHandle = await Storage.getItemAsync(storageKey);
    // Don't overwrite cache
    if (existingHandle) {
      if (__DEV__) {
        console.warn('Cannot start a new auth because another session is already in progress');
      }
      return;
    }

    // Ensure we load the full request before caching it
    const requestJson = await this.getAuthRequestConfigAsync();

    const handle = await PKCE.generateRandomAsync(10);

    // before you make request, persist all request related data in local storage.
    await Promise.all([
      Storage.setItemAsync(storageKey, handle),
      Storage.setItemAsync(authRequestStorageKey(discoveryId, handle), JSON.stringify(requestJson)),
    ]);
  }

  async deletePendingAuthRequestAsync(): Promise<boolean> {
    return deletePendingAuthRequestAsync(await this.getDiscoveryAsync());
  }

  private async ensureCodeIsSetupAsync(): Promise<void> {
    if (this.codeVerifier) {
      return;
    }

    // This method needs to be resolved like all other native methods.
    const { codeVerifier, codeChallenge } = await PKCE.buildCodeAsync();

    this.codeVerifier = codeVerifier;
    this.codeChallenge = codeChallenge;
  }
}

export async function maybeCompleteAuthRequestAfterRedirectAsync(
  urlString?: string
): Promise<AuthSessionResult | null> {
  if (Platform.OS !== 'web') return null;

  if (!urlString) {
    const currentUrl = await getCurrentUrlAsync();
    if (!currentUrl) return null;
    urlString = currentUrl;
  }

  const discoveryId = await Storage.getItemAsync(getDiscoveryStorageKey());
  if (!discoveryId) return null;

  const storageKey = getStorageKey(discoveryId);

  const handle = await Storage.getItemAsync(storageKey);

  // we have a pending request.
  // fetch authorization request, and check state
  const request = await maybeRehydratePendingAuthRequestAsync(discoveryId);
  if (!urlString || !handle || !request) return null;

  return await request.parseReturnUrlAsync(urlString);
}

async function getCurrentUrlAsync(): Promise<string | null> {
  return Platform.select<Promise<string | null>>({
    web: Promise.resolve(window.location.href),
    default: Linking.getInitialURL(),
  });
}

async function maybeRehydratePendingAuthRequestAsync(
  discoveryId: string
): Promise<AuthRequest | null> {
  if (Platform.OS !== 'web') return null;

  const storageKey = getStorageKey(discoveryId);

  const handle = await Storage.getItemAsync(storageKey);
  if (!handle) return null;

  // we have a pending request.
  // fetch authorization request, and check state
  const item = await Storage.getItemAsync(authRequestStorageKey(discoveryId, handle));
  return new AuthRequest(JSON.parse(item!));
}

async function deletePendingAuthRequestAsync(
  discovery: Pick<Discovery, 'authorizationEndpoint'>
): Promise<boolean> {
  if (Platform.OS !== 'web') return false;

  const discoveryId = getDiscoveryId(discovery);
  const storageKey = getStorageKey(discoveryId);
  const handle = await Storage.getItemAsync(storageKey);
  if (!handle) return false;

  // cleanup state
  await Promise.all([
    Storage.deleteItemAsync(storageKey),
    Storage.deleteItemAsync(getDiscoveryStorageKey()),
    Storage.deleteItemAsync(authRequestStorageKey(discoveryId, handle)),
  ]);
  return true;
}

const getDiscoveryId = ({
  authorizationEndpoint,
}: Pick<Discovery, 'authorizationEndpoint'>): string => {
  return encodeURIComponent(authorizationEndpoint);
};
const authRequestStorageKey = (discoveryId: string, handle: string): string =>
  `${getStorageKey(discoveryId)}_${handle}`;
const getStorageKey = (discoveryId: string): string => `expo_auth_request_${discoveryId}`;
const getDiscoveryStorageKey = (): string => `expo_auth_request`;
