import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
import { ProviderAuthRequestConfig } from './Provider.types';

const settings = {
  windowFeatures: { width: 700, height: 600 },
  // These are required for Firebase to work properly which is a reasonable default.
  minimumScopes: ['public_profile', 'email'],
};

export const discovery: DiscoveryDocument = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};

export interface FacebookAuthRequestConfig extends ProviderAuthRequestConfig {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
}

function applyRequiredScopes(scopes: string[] = []): string[] {
  // Add the required scopes for returning profile data.
  const requiredScopes = [...scopes, ...settings.minimumScopes];
  // Remove duplicates
  return [...new Set(requiredScopes)];
}

class FacebookAuthRequest extends AuthRequest {
  constructor({
    language,
    selectAccount,
    extraParams = {},
    clientSecret,
    ...config
  }: FacebookAuthRequestConfig) {
    const inputParams: Record<string, string> = {
      display: 'popup',
      ...extraParams,
    };
    if (language) inputParams.locale = language;
    if (selectAccount && !inputParams.auth_type) inputParams.auth_type = 'reauthenticate';

    // Apply the default scopes
    const scopes = applyRequiredScopes(config.scopes);
    let inputClientSecret: string | undefined;
    //  Facebook will throw if you attempt to use the client secret
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
}

// Only natively in the Expo client.
function shouldUseProxy(): boolean {
  return Platform.select({
    web: false,
    // Use the proxy in the Expo client.
    default: !!Constants.manifest && Constants.appOwnership !== 'standalone',
  });
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
  config: Partial<FacebookAuthRequestConfig> = {},
  redirectUriOptions: Partial<AuthSessionRedirectUriOptions> = {}
): [
  FacebookAuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
] {
  const useProxy = redirectUriOptions.useProxy ?? shouldUseProxy();

  if (typeof config.redirectUri === 'undefined') {
    config.redirectUri = makeRedirectUri({
      native: `fb${config.clientId}://authorize`,
      useProxy,
      ...redirectUriOptions,
      // native: `com.googleusercontent.apps.${guid}:/oauthredirect`,
    });
  }

  const request = useLoadedAuthRequest(
    config as FacebookAuthRequestConfig,
    discovery,
    FacebookAuthRequest
  );

  const [result, promptAsync] = useAuthRequestResult(request, discovery, {
    windowFeatures: settings.windowFeatures,
    useProxy,
  });

  return [request, result, promptAsync];
}
