import { useMemo } from 'react';
import { Platform } from 'react-native';

import { AuthRequestConfig } from '../AuthRequest.types';
import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import {
  AuthRequest,
  AuthRequestPromptOptions,
  AuthSessionRedirectUriOptions,
  AuthSessionResult,
  DiscoveryDocument,
  makeRedirectUri,
  ResponseType,
} from '../AuthSession';
import { generateHexStringAsync } from '../PKCE';
import { ProviderAuthRequestConfig } from './Provider.types';
import { applyRequiredScopes, useProxyEnabled } from './ProviderUtils';

const settings = {
  windowFeatures: { width: 700, height: 600 },
  // These are required for Firebase to work properly which is a reasonable default.
  minimumScopes: ['public_profile', 'email'],
};

export const discovery: DiscoveryDocument = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};

// @needsAudit @docsMissing
export interface FacebookAuthRequestConfig extends ProviderAuthRequestConfig {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
}

// @needsAudit
/**
 * Extends [`AuthRequest`](#authrequest) and accepts [`FacebookAuthRequest`](#facebookauthrequest) in the constructor.
 */
class FacebookAuthRequest extends AuthRequest {
  nonce?: string;

  constructor({
    language,
    // Account selection cannot be reliably emulated on Facebook.
    extraParams = {},
    clientSecret,
    ...config
  }: FacebookAuthRequestConfig) {
    const inputParams: Record<string, string> = {
      display: 'popup',
      ...extraParams,
    };
    if (language) {
      inputParams.locale = language;
    }

    // Apply the default scopes
    const scopes = applyRequiredScopes(config.scopes, settings.minimumScopes);
    let inputClientSecret: string | undefined;
    //  Facebook will throw if you attempt to use the client secret
    if (config.responseType && config.responseType !== ResponseType.Code) {
      // TODO: maybe warn that you shouldn't store the client secret on the client
      inputClientSecret = clientSecret;
    }
    // Default to implicit auth
    if (!config.responseType) {
      config.responseType = ResponseType.Token;
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
    if (!extraParams.nonce && !this.nonce) {
      if (!this.nonce) {
        this.nonce = await generateHexStringAsync(16);
      }
      extraParams.auth_nonce = this.nonce;
    }
    return {
      ...config,
      extraParams,
    };
  }
}

/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.dev/guides/authentication/#facebook)
 *
 * @param config
 * @param redirectUriOptions
 */
export function useAuthRequest(
  config: Partial<FacebookAuthRequestConfig> = {},
  redirectUriOptions: Partial<AuthSessionRedirectUriOptions> = {}
): [
  FacebookAuthRequest | null,
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
    return config[propertyName as any] ?? config.clientId;
  }, [
    useProxy,
    config.expoClientId,
    config.iosClientId,
    config.androidClientId,
    config.webClientId,
    config.clientId,
  ]);

  const redirectUri = useMemo((): string => {
    if (typeof config.redirectUri !== 'undefined') {
      return config.redirectUri;
    }

    return makeRedirectUri({
      // The redirect URI should be created using fb + client ID on native.
      native: `fb${clientId}://authorize`,
      useProxy,
      ...redirectUriOptions,
    });
  }, [useProxy, clientId, config.redirectUri, redirectUriOptions]);

  const extraParams = useMemo((): FacebookAuthRequestConfig['extraParams'] => {
    const output = config.extraParams ? { ...config.extraParams } : {};

    if (config.language) {
      output.locale = config.language;
    }
    return output;
  }, [config.extraParams, config.language]);

  const request = useLoadedAuthRequest(
    {
      ...config,
      extraParams,
      clientId,
      redirectUri,
    },
    discovery,
    FacebookAuthRequest
  );

  const [result, promptAsync] = useAuthRequestResult(request, discovery, {
    windowFeatures: settings.windowFeatures,
    useProxy,
  });

  return [request, result, promptAsync];
}
