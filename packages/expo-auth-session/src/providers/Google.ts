import * as Application from 'expo-application';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import {
  AuthRequest,
  AuthRequestConfig,
  AuthRequestPromptOptions,
  AuthSessionRedirectUriOptions,
  AuthSessionResult,
  DiscoveryDocument,
  generateHexStringAsync,
  makeRedirectUri,
  Prompt,
  ResponseType,
} from '../AuthSession';
import { AccessTokenRequest } from '../TokenRequest';
import { ProviderAuthRequestConfig } from './Provider.types';
import { applyRequiredScopes, invariantClientId, useProxyEnabled } from './ProviderUtils';

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

export interface GoogleAuthRequestConfig extends ProviderAuthRequestConfig {
  /**
   * If the user's email address is known ahead of time, it can be supplied to be the default option.
   * If the user has approved access for this app in the past then auth may return without any further interaction.
   */
  loginHint?: string;
  /**
   * When `true`, the service will allow the user to switch between accounts (if possible). Defaults to `false`.
   */
  selectAccount?: boolean;
  /**
   * Proxy client ID for use in the Expo client on iOS and Android.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: Web Application
   * - **URIs**: https://auth.expo.io
   * - **Authorized redirect URIs**: https://auth.expo.io/@your-username/your-project-slug
   */
  expoClientId?: string;
  /**
   * Expo web client ID for use in the browser.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: Web Application
   * - Give it a name (e.g. "Web App").
   * - **URIs** (Authorized JavaScript origins): https://localhost:19006 & https://yourwebsite.com
   * - **Authorized redirect URIs**: https://localhost:19006 & https://yourwebsite.com
   * - To test this be sure to start your app with `expo start:web --https`.
   */
  webClientId?: string;
  /**
   * iOS native client ID for use in standalone, bare workflow, and custom clients.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: iOS Application
   * - Give it a name (e.g. "iOS App").
   * - **Bundle ID**: Must match the value of `ios.bundleIdentifier` in your `app.json`.
   * - Your app needs to conform to the URI scheme matching your bundle identifier.
   *   - _Standalone_: Automatically added, do nothing.
   *   - _Bare workflow_: Run `npx uri-scheme add <your bundle id> --ios`
   * - To test this you can:
   *   1. Eject to bare: `expo eject` and run `yarn ios`
   *   2. Create a custom client: `expo client:ios`
   *   3. Build a production IPA: `expo build:ios`
   * - Whenever you change the values in `app.json` you'll need to rebuild the native app.
   */
  iosClientId?: string;
  /**
   * Android native client ID for use in standalone, and bare workflow.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: Android Application
   * - Give it a name (e.g. "Android App").
   * - **Package name**: Must match the value of `android.package` in your `app.json`.
   * - Your app needs to conform to the URI scheme matching your `android.package` (ex. `com.myname.mycoolapp:/`).
   *   - _Standalone_: Automatically added, do nothing.
   *   - _Bare workflow_: Run `npx uri-scheme add <your android.package> --android`
   * - **Signing-certificate fingerprint**:
   *   - Run `expo credentials:manager -p android` then select "Update upload Keystore" -> "Generate new keystore" -> "Go back to experience overview"
   *   - Copy your "Google Certificate Fingerprint", it will output a string that looks like `A1:B2:C3` but longer.
   * - To test this you can:
   *   1. Eject to bare: `expo eject` and run `yarn ios`
   *   2. Build a production IPA: `expo build:android`
   */
  androidClientId?: string;
  /**
   * Should the hook automatically exchange the response code for an authentication token.
   *
   * Defaults to true on installed apps (iOS, Android) when `ResponseType.Code` is used (default).
   */
  shouldAutoExchangeCode?: boolean;
}

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
 * - [Get Started](https://docs.expo.io/guides/authentication/#google)
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
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const useProxy = useProxyEnabled(redirectUriOptions);

  const isWebAuth = useProxy || Platform.OS === 'web';

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
    { ...redirectUriOptions, useProxy }
  );
}

/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes, then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.io/guides/authentication/#google)
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
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const useProxy = useProxyEnabled(redirectUriOptions);

  const clientId = useMemo((): string => {
    const propertyName = useProxy
      ? 'expoClientId'
      : Platform.select({
          ios: 'iosClientId',
          android: 'androidClientId',
          default: 'webClientId',
        });

    const clientId = config[propertyName as any] ?? config.clientId;
    invariantClientId(propertyName, clientId, 'Google');
    return clientId;
  }, [
    useProxy,
    config.expoClientId,
    config.iosClientId,
    config.androidClientId,
    config.webClientId,
    config.clientId,
  ]);

  const responseType = useMemo(() => {
    // Allow overrides.
    if (typeof config.responseType !== 'undefined') {
      return config.responseType;
    }
    // You can only use `response_token=code` on installed apps (iOS, Android without proxy).
    // Installed apps can auto exchange without a client secret and get the token and id-token (Firebase).
    const isInstalledApp = Platform.OS !== 'web' && !useProxy;
    // If the user provided the client secret (they shouldn't!) then use code exchange by default.
    if (config.clientSecret || isInstalledApp) {
      return ResponseType.Code;
    }
    // This seems the most pragmatic option since it can result in a full authentication on web and proxy platforms as expected.
    return ResponseType.Token;
  }, [config.responseType, config.clientSecret, useProxy]);

  const redirectUri = useMemo((): string => {
    if (typeof config.redirectUri !== 'undefined') {
      return config.redirectUri;
    }

    return makeRedirectUri({
      native: `${Application.applicationId}:/oauthredirect`,
      useProxy,
      ...redirectUriOptions,
      // native: `com.googleusercontent.apps.${guid}:/oauthredirect`,
    });
  }, [useProxy, config.redirectUri, redirectUriOptions]);

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
    useProxy,
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
