import { AuthorizationRequest, AuthorizationResponse, TokenResponse } from '@openid/appauth';
import invariant from 'invariant';

import { ExpoAccessTokenRequest, ExpoAccessTokenRequestJson } from './ExpoAccessTokenRequest';
import { ExpoAuthorizationRequest, ExpoAuthorizationRequestJson } from './ExpoAuthorizationRequest';
import {
  ExpoAuthorizationServiceConfiguration,
  ExpoAuthorizationServiceConfigurationJson,
} from './ExpoAuthorizationServiceConfiguration';
import { ExpoRefreshTokenRequest, ExpoRefreshTokenRequestJson } from './ExpoRefreshTokenRequest';
import { RegistrationHandler, RegistrationResponse } from './RegistrationHandler';
import {
  ExpoRegistrationRequest,
  ExpoRegistrationRequestJson,
  ExpoRegistrationResponse,
} from './ExpoRegistrationHandler';
import { ExpoRequestHandler } from './ExpoRequestHandler';
import { ExpoRevokeTokenRequest, ExpoRevokeTokenRequestJson } from './ExpoRevokeTokenRequest';
import { ExpoTokenRequestHandler } from './ExpoTokenRequestHandler';

export type IssuerOrServiceConfig =
  | string
  | ExpoAuthorizationServiceConfiguration
  | ExpoAuthorizationServiceConfigurationJson;

/**
 * Utility method for resolving the service config from an issuer or object.
 *
 * @param issuerOrServiceConfig
 */
export async function resolveServiceConfigAsync(
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<ExpoAuthorizationServiceConfiguration> {
  invariant(
    issuerOrServiceConfig && !['number', 'boolean'].includes(typeof issuerOrServiceConfig),
    'Expected a valid service configuration or issuer URL'
  );
  if (typeof issuerOrServiceConfig === 'string') {
    return await ExpoAuthorizationServiceConfiguration.fetchFromIssuer(issuerOrServiceConfig);
  } else if (issuerOrServiceConfig.constructor.name === 'ExpoAuthorizationServiceConfiguration') {
    return issuerOrServiceConfig as ExpoAuthorizationServiceConfiguration;
  }
  return new ExpoAuthorizationServiceConfiguration(issuerOrServiceConfig);
}

/**
 * Authenticate and auto exchange the code for an access token.
 */
export async function authAsync(
  props: ExpoAuthorizationRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse> {
  const request = new ExpoAuthorizationRequest({
    responseType: AuthorizationRequest.RESPONSE_TYPE_CODE,
    ...props,
  });
  // Using responseType token probably indicates that the developer wants to perform a hybrid flow.
  // Two possible cases:
  // 1. The code is not for this client, ie. will be sent to a
  //    web service that performs the ID token verification and token
  //    exchange.
  // 2. The code is for this client and, for security reasons, the
  //    application developer must verify the id_token signature and
  //    c_hash before calling the token endpoint.
  invariant(
    request.responseType === AuthorizationRequest.RESPONSE_TYPE_CODE,
    `Expected { responseType: 'code' }. Please use AppAuth.authRequestAsync() directly for token requests.`
  );

  // Get the service config
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  const response = await authRequestAsync(request, config);

  // If the request is for the code flow (NB. not hybrid), then assume the
  // code is intended for this client, and perform the authorization
  // code exchange.
  return await exchangeAsync(
    {
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      code: response.response.code,
      clientSecret: response.request?.extras?.client_secret,
      codeVerifier: response.request?.internal?.code_verifier,
    },
    config
  );
}

/**
 * Make an auth request that returns the auth code which can be exchanged for an access token.
 *
 * @param request
 * @param issuerOrServiceConfig
 */
export async function authRequestAsync(
  request: ExpoAuthorizationRequest,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<{ request: AuthorizationRequest; response: AuthorizationResponse }> {
  // Eval early
  await request.toJson();
  // Get the service config
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  const handler = new ExpoRequestHandler();
  return await handler.performAuthorizationRequestAsync(config, request);
}

export async function exchangeAsync(
  props: ExpoAccessTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse> {
  // use the code to make the token request.
  /**
   * If this fails (status 400), it's either because the PKCE code is wrong, or because too many params are being passed in the body:
   * If you get the error `invalid_grant` please refer to https://www.oauth.com/oauth2-servers/pkce/authorization-code-exchange/
   *
   * grant_type=authorization_code
   * redirect_uri=''
   * code=''
   * code_verifier=''
   */
  const request = new ExpoAccessTokenRequest(props);
  const handler = new ExpoTokenRequestHandler();
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  const response = await handler.performTokenRequest(config, request);
  return response;
}

export async function refreshAsync(
  props: ExpoRefreshTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse> {
  const request = new ExpoRefreshTokenRequest(props);
  const handler = new ExpoTokenRequestHandler();
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  const response = await handler.performTokenRequest(config, request);

  // Custom: reuse the refresh token if one wasn't returned
  response.refreshToken = response.refreshToken ?? props.refreshToken;

  return response;
}

export async function registerAsync(
  props: ExpoRegistrationRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<RegistrationResponse> {
  const request = new ExpoRegistrationRequest(props);
  const handler = new RegistrationHandler();
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  const response = await handler.performRegistrationRequest(config, request);
  return response;
}

export async function revokeAsync(
  props: ExpoRevokeTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<boolean> {
  const request = new ExpoRevokeTokenRequest(props);
  const handler = new ExpoTokenRequestHandler();
  const config = await resolveServiceConfigAsync(issuerOrServiceConfig);
  // Add a slightly more helpful error message for issuers that don't support revocation.
  invariant(
    config.revocationEndpoint || typeof issuerOrServiceConfig !== 'string',
    `Cannot revoke token without a valid revocation endpoint in the authorization service configuration. The supplied issuer "${issuerOrServiceConfig}" may not support token revocation.`
  );
  const response = await handler.performRevokeTokenRequest(config, request);
  return response;
}
