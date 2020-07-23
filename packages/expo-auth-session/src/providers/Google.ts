import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import {
  AuthRequest,
  AuthRequestConfig,
  AuthRequestPromptOptions,
  AuthSessionResult,
  DiscoveryDocument,
  generateHexStringAsync,
  makeRedirectUri,
  Prompt,
  ResponseType,
  AuthSessionRedirectUriOptions,
} from '../AuthSession';
import {
  AccessTokenRequest,
  fetchUserInfoAsync as _fetchUserInfoAsync,
  TokenResponse,
} from '../TokenRequest';
import { ProviderAuthRequestConfig, ProviderUser } from './Provider.types';

const settings = {
  windowFeatures: { width: 515, height: 680 },
  minimumScopes: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
};

// Updated Jun 22, 2020
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
   * - **URIs**: https://yourwebsite.com | https://localhost:19006
   * - **Authorized redirect URIs**: https://yourwebsite.com | https://localhost:19006
   */
  webClientId?: string;

  /**
   * iOS native client ID for use in standalone, bare-workflow, and custom clients.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: iOS Application
   * - **Bundle ID**: Must match the value of `ios.bundleIdentifier` in your `app.json`.
   * - Your app needs to conform to the URI scheme matching your bundle identifier.
   *   - **Standalone**: Automatically added, do nothing.
   *   - **Bare-workflow**: Run `npx uri-scheme add <your bundle id> --ios`
   */
  iosClientId?: string;
  /**
   * Android native client ID for use in standalone, bare-workflow, and custom clients.
   *
   * This Google Client ID must be setup as follows:
   *
   * - **Application Type**: Android Application
   * - **Package name**: Must match the value of `android.package` in your `app.json`.
   * - **Signing-certificate fingerprint**: Run `openssl rand -base64 32 | openssl sha1 -c` for the results.
   * - Your app needs to conform to the URI scheme matching your android package.
   *   - **Standalone**: Automatically added, do nothing.
   *   - **Bare-workflow**: Run `npx uri-scheme add <your android package> --android`
   */
  androidClientId?: string;
}

function applyRequiredScopes(scopes: string[] = []): string[] {
  // Add the required scopes for returning profile data.
  const requiredScopes = [...scopes, ...settings.minimumScopes];
  // Remove duplicates
  return [...new Set(requiredScopes)];
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
    const scopes = applyRequiredScopes(config.scopes);
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

// Only natively in the Expo client.
function shouldUseProxy(): boolean {
  return Platform.select({
    web: false,
    // Use the proxy in the Expo client.
    default: !!Constants.manifest && Constants.appOwnership !== 'standalone',
  });
}

function invariantClientId(idName: string, value: any) {
  if (typeof value === 'undefined')
    // TODO(Bacon): Add learn more
    throw new Error(
      `Client Id property \`${idName}\` must be defined to use Google auth on this platform.`
    );
}

/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 *  - TODO: Put Getting started guide URL here
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(
  config: Partial<GoogleAuthRequestConfig> = {},
  redirectUriOptions: Partial<AuthSessionRedirectUriOptions> = {}
): [
  GoogleAuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const useProxy = redirectUriOptions.useProxy ?? shouldUseProxy();

  const propertyName = useProxy
    ? 'expoClientId'
    : Platform.select({
        ios: 'iosClientId',
        android: 'androidClientId',
        default: 'webClientId',
      });
  config.clientId = config[propertyName as any] ?? config.clientId;
  invariantClientId(propertyName, config.clientId);

  if (typeof config.redirectUri === 'undefined') {
    config.redirectUri = makeRedirectUri({
      native: `${Application.applicationId}:/oauthredirect`,
      useProxy,
      ...redirectUriOptions,
      // native: `com.googleusercontent.apps.${guid}:/oauthredirect`,
    });
  }

  const request = useLoadedAuthRequest(
    config as GoogleAuthRequestConfig,
    discovery,
    GoogleAuthRequest
  );

  const [result, promptAsync] = useAuthRequestResult(request, discovery, {
    useProxy,
    windowFeatures: settings.windowFeatures,
  });

  return [request, result, promptAsync];
}

/**
 * Fetch generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export async function fetchUserInfoAsync(
  response: Pick<TokenResponse, 'accessToken'>
): Promise<ProviderUser> {
  const providerData = await _fetchUserInfoAsync(response, discovery);

  const user = {
    name: providerData.name,
    email: providerData.email,
    id: providerData.id,
    picture: providerData.picture,
    providerData,
  };
  return user;
}
