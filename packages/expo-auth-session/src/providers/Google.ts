import * as Application from 'expo-application';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { ProviderAuthRequestConfig } from './Provider.types';
import { applyRequiredScopes, invariantClientId } from './ProviderUtils';
import { AuthRequest } from '../AuthRequest';
import {
  AuthRequestConfig,
  AuthRequestPromptOptions,
  Prompt,
  ResponseType,
} from '../AuthRequest.types';
import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import { makeRedirectUri } from '../AuthSession';
import { AuthSessionRedirectUriOptions, AuthSessionResult } from '../AuthSession.types';
import { DiscoveryDocument } from '../Discovery';
import { generateHexStringAsync } from '../PKCE';
import { AccessTokenRequest } from '../TokenRequest';

const settings = {
  windowFeatures: { width: 515, height: 680 },
  minimumScopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
};

export const discovery: DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

// @needsAudit
/**
 * @deprecated See [Google authentication](/guides/google-authentication/).
 */
export type GoogleAuthRequestConfig = ProviderAuthRequestConfig & {
  /**
   * If the user's email address is known ahead of time, it can be supplied to be the default option.
   * If the user has approved access for this app in the past then auth may return without any further interaction.
   */
  loginHint?: string;
  /**
   * When `true`, the service will allow the user to switch between accounts (if possible).
   * @default false.
   */
  selectAccount?: boolean;
  /**
   * Expo web client ID for use in the browser.
   */
  webClientId?: string;
  /**
   * iOS native client ID for use in standalone, bare workflow, and custom clients.
   */
  iosClientId?: string;
  /**
   * Android native client ID for use in standalone, and bare workflow.
   */
  androidClientId?: string;
  /**
   * Should the hook automatically exchange the response code for an authentication token.
   *
   * Defaults to `true` on installed apps (Android, iOS) when `ResponseType.Code` is used (default).
   */
  shouldAutoExchangeCode?: boolean;
  /**
   * Language code ISO 3166-1 alpha-2 region code, such as 'it' or 'pt-PT'.
   */
  language?: string;
};

// @needsAudit
/**
 * Extends [`AuthRequest`](#authrequest) and accepts [`GoogleAuthRequestConfig`](#googleauthrequestconfig) in the constructor.
 */
class GoogleAuthRequest extends AuthRequest {
  nonce?: string;

  constructor({
    language,
    loginHint,
    selectAccount,
    extraParams = {},
    clientSecret,
    ...config
  }: GoogleAuthRequestConfig) {
    const inputParams = {
      ...extraParams,
    };
    if (language) inputParams.hl = language;
    if (loginHint) inputParams.login_hint = loginHint;
    if (selectAccount) inputParams.prompt = Prompt.SelectAccount;

    // Apply the default scopes
    const scopes = applyRequiredScopes(config.scopes, settings.minimumScopes);
    const isImplicit =
      config.responseType === ResponseType.Token || config.responseType === ResponseType.IdToken;
    if (isImplicit) {
      // PKCE must be disabled in implicit mode.
      config.usePKCE = false;
    }
    let inputClientSecret: string | undefined;
    //  Google will throw if you attempt to use the client secret
    if (config.responseType && config.responseType !== ResponseType.Code) {
      // TODO: maybe warn that you shouldn't store the client secret on the client
      inputClientSecret = clientSecret;
    }
    super({
      ...config,
      clientSecret: inputClientSecret,
      scopes,
      extraParams: inputParams,
    });
  }

  /**
   * Load and return a valid auth request based on the input config.
   */
  async getAuthRequestConfigAsync(): Promise<AuthRequestConfig> {
    const { extraParams = {}, ...config } = await super.getAuthRequestConfigAsync();
    if (config.responseType === ResponseType.IdToken && !extraParams.nonce && !this.nonce) {
      if (!this.nonce) {
        this.nonce = await generateHexStringAsync(16);
      }
      extraParams.nonce = this.nonce;
    }
    return {
      ...config,
      extraParams,
    };
  }
}

/**
 * Load an authorization request with an ID Token for authentication with Firebase.
 *
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * The id token can be retrieved with `response.params.id_token`.
 *
 * - [Get Started](https://docs.expo.dev/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export function useIdTokenAuthRequest(
  config: Partial<GoogleAuthRequestConfig>,
  redirectUriOptions: Partial<AuthSessionRedirectUriOptions> = {}
): [
  GoogleAuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>,
] {
  const isWebAuth = Platform.OS === 'web';

  return useAuthRequest(
    {
      ...config,
      responseType:
        // If the client secret is provided then code can be used
        !config.clientSecret &&
        // When web auth is used, we can request the `id_token` directly without exchanging a code.
        isWebAuth
          ? ResponseType.IdToken
          : undefined,
    },
    { ...redirectUriOptions }
  );
}

/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes, then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.dev/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export function useAuthRequest(
  config: Partial<GoogleAuthRequestConfig> = {},
  redirectUriOptions: Partial<AuthSessionRedirectUriOptions> = {}
): [
  GoogleAuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>,
] {
  const clientId = useMemo(() => {
    const propertyName = Platform.select({
      ios: 'iosClientId',
      android: 'androidClientId',
      default: 'webClientId',
    } as const);
    const clientId = config[propertyName] ?? config.clientId;
    invariantClientId(propertyName, clientId, 'Google');
    return clientId;
  }, [config.iosClientId, config.androidClientId, config.webClientId, config.clientId]);

  const responseType = useMemo(() => {
    // Allow overrides.
    if (typeof config.responseType !== 'undefined') {
      return config.responseType;
    }
    // You can only use `response_token=code` on installed apps (iOS, Android without proxy).
    // Installed apps can auto exchange without a client secret and get the token and id-token (Firebase).
    const isInstalledApp = Platform.OS !== 'web';
    // If the user provided the client secret (they shouldn't!) then use code exchange by default.
    if (config.clientSecret || isInstalledApp) {
      return ResponseType.Code;
    }
    // This seems the most pragmatic option since it can result in a full authentication on web and proxy platforms as expected.
    return ResponseType.Token;
  }, [config.responseType, config.clientSecret]);

  const redirectUri = useMemo((): string => {
    if (typeof config.redirectUri !== 'undefined') {
      return config.redirectUri;
    }

    return makeRedirectUri({
      native: `${Application.applicationId}:/oauthredirect`,
      ...redirectUriOptions,
      // native: `com.googleusercontent.apps.${guid}:/oauthredirect`,
    });
  }, [config.redirectUri, redirectUriOptions]);

  const extraParams = useMemo((): GoogleAuthRequestConfig['extraParams'] => {
    const output = config.extraParams ? { ...config.extraParams } : {};

    if (config.language) {
      output.hl = output.language;
    }
    if (config.loginHint) {
      output.login_hint = output.loginHint;
    }
    if (config.selectAccount) {
      output.prompt = Prompt.SelectAccount;
    }
    return output;
  }, [config.extraParams, config.language, config.loginHint, config.selectAccount]);

  const request = useLoadedAuthRequest(
    {
      ...config,
      responseType,
      extraParams,
      clientId,
      redirectUri,
    },
    discovery,
    GoogleAuthRequest
  );

  const [result, promptAsync] = useAuthRequestResult(request, discovery, {
    windowFeatures: settings.windowFeatures,
  });

  const [fullResult, setFullResult] = useState<AuthSessionResult | null>(null);

  const shouldAutoExchangeCode = useMemo(() => {
    // allow overrides
    if (typeof config.shouldAutoExchangeCode !== 'undefined') {
      return config.shouldAutoExchangeCode;
    }

    // has a code to exchange and doesn't have an authentication yet.
    return result?.type === 'success' && result.params.code && !result.authentication;
  }, [config.shouldAutoExchangeCode, result?.type]);

  useEffect(() => {
    let isMounted = true;
    if (shouldAutoExchangeCode && result?.type === 'success') {
      const exchangeRequest = new AccessTokenRequest({
        clientId,
        clientSecret: config.clientSecret,
        redirectUri,
        scopes: config.scopes,
        code: result.params.code,
        extraParams: {
          code_verifier: request?.codeVerifier || '',
        },
      });
      exchangeRequest.performAsync(discovery).then((authentication) => {
        if (isMounted) {
          setFullResult({
            ...result,
            params: {
              id_token: authentication?.idToken || '',
              access_token: authentication.accessToken,
              ...result.params,
            },
            authentication,
          });
        }
      });
    } else {
      setFullResult(result);
    }
    return () => {
      isMounted = false;
    };
  }, [
    clientId,
    redirectUri,
    shouldAutoExchangeCode,
    config.clientSecret,
    config.scopes?.join(','),
    request?.codeVerifier,
    result,
  ]);

  return [request, fullResult, promptAsync];
}
