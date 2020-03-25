import {
  AppAuthError,
  AuthorizationServiceConfiguration,
  BaseTokenRequestHandler,
  BasicQueryStringUtils,
  QueryStringUtils,
  Requestor,
  RevokeTokenRequest,
  StringMap,
  TokenError,
  TokenErrorJson,
  TokenRequest,
  TokenResponse,
  TokenResponseJson,
} from '@openid/appauth';

import {
  ExpoAuthorizationServiceConfiguration,
  ExpoAuthorizationServiceConfigurationJson,
} from './ExpoAuthorizationServiceConfiguration';
import { encodeBase64NoWrap } from './ExpoCrypto';
import { ExpoRequestor } from './ExpoRequestor';
import { ExpoTokenRequest } from './ExpoTokenRequest';

/**
 * The default token request handler.
 */
export class ExpoTokenRequestHandler extends BaseTokenRequestHandler {
  constructor(
    requestor: Requestor = new ExpoRequestor(),
    utils: QueryStringUtils = new BasicQueryStringUtils()
  ) {
    super(requestor, utils);
  }

  async performRevokeTokenRequest(
    configuration: AuthorizationServiceConfiguration | ExpoAuthorizationServiceConfiguration,
    request: RevokeTokenRequest
  ): Promise<boolean> {
    if (!configuration.revocationEndpoint) {
      throw new Error(
        `Cannot revoke token without a valid \`revocationEndpoint\` in the authorization service configuration.`
      );
    }
    await this.requestor.xhr<boolean>({
      url: configuration.revocationEndpoint,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: this.utils.stringify(request.toStringMap()),
    });

    return true;
  }

  private getHeaders(request: TokenRequest): StringMap {
    const headers: StringMap = { 'Content-Type': 'application/x-www-form-urlencoded' };
    // From the OAuth2 RFC, client ID and secret should be encoded prior to concatenation and
    // conversion to Base64: https://tools.ietf.org/html/rfc6749#section-2.3.1
    if (request instanceof ExpoTokenRequest && typeof request.clientSecret !== 'undefined') {
      const encodedClientId = encodeURIComponent(request.clientId);
      const encodedClientSecret = encodeURIComponent(request.clientSecret);
      const credentials = `${encodedClientId}:${encodedClientSecret}`;
      const basicAuth = encodeBase64NoWrap(credentials);
      headers.Authorization = `Basic ${basicAuth}`;
    }

    return headers;
  }

  async performTokenRequest(
    configuration: AuthorizationServiceConfiguration | ExpoAuthorizationServiceConfigurationJson,
    request: TokenRequest
  ): Promise<TokenResponse> {
    const response = await this.requestor.xhr<TokenResponseJson | TokenErrorJson>({
      url: configuration.tokenEndpoint,
      method: 'POST',
      dataType: 'json', // adding implicit dataType
      headers: this.getHeaders(request),
      data: this.utils.stringify(request.toStringMap()),
    });

    if (isTokenResponse(response)) {
      return new TokenResponse(response);
    }
    throw new AppAuthError(response.error, new TokenError(response));
  }
}

function isTokenResponse(
  response: TokenResponseJson | TokenErrorJson
): response is TokenResponseJson {
  return (response as TokenErrorJson).error === undefined;
}
