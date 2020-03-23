import {
  AuthorizationNotifier,
  AuthorizationRequest,
  AuthorizationResponse,
  TokenResponse,
} from '@openid/appauth';
import invariant from 'invariant';

import { ExpoAccessTokenRequest, ExpoAccessTokenRequestJson } from './ExpoAccessTokenRequest';
import { ExpoAuthorizationRequest } from './ExpoAuthorizationRequest';
import {
  ExpoAuthorizationServiceConfiguration,
  ExpoAuthorizationServiceConfigurationJson,
} from './ExpoAuthorizationServiceConfiguration';
import { ExpoRefreshTokenRequest, ExpoRefreshTokenRequestJson } from './ExpoRefreshTokenRequest';
import {
  ExpoRegistrationHandler,
  ExpoRegistrationRequest,
  ExpoRegistrationRequestJson,
  ExpoRegistrationResponse,
} from './ExpoRegistrationHandler';
import { ExpoRequestHandler } from './ExpoRequestHandler';
import { ExpoRevokeTokenRequest, ExpoRevokeTokenRequestJson } from './ExpoRevokeTokenRequest';
import { ExpoTokenRequestHandler } from './ExpoTokenRequestHandler';

type IssuerOrServiceConfig =
  | string
  | ExpoAuthorizationServiceConfiguration
  | ExpoAuthorizationServiceConfigurationJson;

/**
 * Utility method for resolving the service config
 *
 * @param issuerOrServiceConfig
 */
async function serviceConfigFromPropsAsync(
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<ExpoAuthorizationServiceConfiguration> {
  invariant(issuerOrServiceConfig, 'Expected a valid service configuration or issuer URL');
  if (typeof issuerOrServiceConfig === 'string') {
    return await ExpoAuthorizationServiceConfiguration.fetchFromIssuer(issuerOrServiceConfig);
  } else if (issuerOrServiceConfig.constructor.name === 'ExpoAuthorizationServiceConfiguration') {
    return issuerOrServiceConfig as ExpoAuthorizationServiceConfiguration;
  }
  return new ExpoAuthorizationServiceConfiguration(issuerOrServiceConfig);
}

/**
 * Wrap the browser API and make it more node friendly.
 *
 * @param props
 */
export async function authAsync(
  request: ExpoAuthorizationRequest,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse | AuthorizationResponse> {
  // Eval early
  await request.toJson();

  // Get the service config
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);
  const authResponse = await authRequestAsync(request, config);
  console.log(`Authorization Code ${authResponse.response.code}`);
  // inspects response and processes further if needed (e.g. authorization
  // code exchange)
  if (request.responseType === AuthorizationRequest.RESPONSE_TYPE_CODE) {
    // If the request is for the code flow (NB. not hybrid), then assume the
    // code is intended for this client, and perform the authorization
    // code exchange.
    return await exchangeAsync(
      {
        clientId: request.clientId,
        redirectUri: request.redirectUri,
        code: authResponse.response.code,
        clientSecret: authResponse.request?.extras?.client_secret,
        codeVerifier: authResponse.request?.internal?.code_verifier,
      },
      config
    );
  }
  // Hybrid flow (code id_token).
  // Two possible cases:
  // 1. The code is not for this client, ie. will be sent to a
  //    web service that performs the ID token verification and token
  //    exchange.
  // 2. The code is for this client and, for security reasons, the
  //    application developer must verify the id_token signature and
  //    c_hash before calling the token endpoint.
  return authResponse.response;
}

/**
 * Make an auth request that returns the auth code which can be exchanged for an access token.
 *
 * @param props
 * @param issuerOrServiceConfig
 */
export async function authRequestAsync(
  request: ExpoAuthorizationRequest,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<{ request: AuthorizationRequest; response: AuthorizationResponse }> {
  invariant(
    request.redirectUri,
    `\`ExpoAuthorizationRequest\` requires a valid \`redirectUri\`. Example: 'com.your.app:/oauthredirect'`
  );
  // Get the service config
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);

  return new Promise(async (resolve, reject) => {
    const notifier = new AuthorizationNotifier();
    const authorizationHandler = new ExpoRequestHandler();
    // set notifier to deliver responses
    authorizationHandler.setAuthorizationNotifier(notifier);
    // set a listener to listen for authorization responses
    notifier.setAuthorizationListener(async (_, response, error) => {
      if (response) {
        resolve({ request, response });
      } else {
        reject(error);
      }
    });

    // Make the authorization request (launch the external web browser).
    authorizationHandler.performAuthorizationRequest(config, request);
    // Complete the request.
    // This resolves the promise and invokes the authorization listener we defined earlier.
    authorizationHandler.completeAuthorizationRequestIfPossible();
  });
}

export async function exchangeAsync(
  props: ExpoAccessTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse> {
  invariant(
    props.redirectUri,
    `\`ExpoAccessTokenRequest\` requires a valid \`redirectUri\`. Example: 'com.your.app:/oauthredirect'`
  );
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
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);
  const response = await handler.performTokenRequest(config, request);
  return response;
}

export async function refreshAsync(
  props: ExpoRefreshTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<TokenResponse> {
  invariant(props.refreshToken, `\`ExpoRefreshTokenRequest\` requires a valid \`refreshToken\`.`);
  const request = new ExpoRefreshTokenRequest(props);
  const handler = new ExpoTokenRequestHandler();
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);
  const response = await handler.performTokenRequest(config, request);

  // Custom: reuse the refresh token if one wasn't returned
  response.refreshToken = response.refreshToken || props.refreshToken;

  return response;
}

export async function registerAsync(
  props: ExpoRegistrationRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<ExpoRegistrationResponse> {
  const request = new ExpoRegistrationRequest(props);
  const handler = new ExpoRegistrationHandler();
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);
  const response = await handler.performRegistrationRequest(config, request);
  return response;
}

export async function revokeAsync(
  props: ExpoRevokeTokenRequestJson,
  issuerOrServiceConfig: IssuerOrServiceConfig
): Promise<any> {
  const request = new ExpoRevokeTokenRequest(props);
  const handler = new ExpoTokenRequestHandler();
  const config = await serviceConfigFromPropsAsync(issuerOrServiceConfig);
  const response = await handler.performRevokeTokenRequest(config, request);
  return response;
}
