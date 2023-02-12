import invariant from 'invariant';
import { Platform } from 'react-native';

import * as Base64 from './Base64';
import * as ServiceConfig from './Discovery';
import { ResponseErrorConfig, TokenError } from './Errors';
import { Headers, requestAsync } from './Fetch';
import {
  AccessTokenRequestConfig,
  GrantType,
  RefreshTokenRequestConfig,
  RevokeTokenRequestConfig,
  ServerTokenResponseConfig,
  TokenRequestConfig,
  TokenResponseConfig,
  TokenType,
  TokenTypeHint,
} from './TokenRequest.types';

/**
 * Returns the current time in seconds.
 */
export function getCurrentTimeInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Token Response.
 *
 * [Section 5.1](https://tools.ietf.org/html/rfc6749#section-5.1)
 */
export class TokenResponse implements TokenResponseConfig {
  /**
   * Determines whether a token refresh request must be made to refresh the tokens
   *
   * @param token
   * @param secondsMargin
   */
  static isTokenFresh(
    token: Pick<TokenResponse, 'expiresIn' | 'issuedAt'>,
    /**
     * -10 minutes in seconds
     */
    secondsMargin: number = 60 * 10 * -1
  ): boolean {
    if (!token) {
      return false;
    }
    if (token.expiresIn) {
      const now = getCurrentTimeInSeconds();
      return now < token.issuedAt + token.expiresIn + secondsMargin;
    }
    // if there is no expiration time but we have an access token, it is assumed to never expire
    return true;
  }
  /**
   * Creates a `TokenResponse` from query parameters returned from an `AuthRequest`.
   *
   * @param params
   */
  static fromQueryParams(params: Record<string, any>): TokenResponse {
    return new TokenResponse({
      accessToken: params.access_token,
      refreshToken: params.refresh_token,
      scope: params.scope,
      state: params.state,
      idToken: params.id_token,
      tokenType: params.token_type,
      expiresIn: params.expires_in,
      issuedAt: params.issued_at,
    });
  }

  accessToken: string;
  tokenType: TokenType;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  state?: string;
  idToken?: string;
  issuedAt: number;

  constructor(response: TokenResponseConfig) {
    this.accessToken = response.accessToken;
    this.tokenType = response.tokenType ?? 'bearer';
    this.expiresIn = response.expiresIn;
    this.refreshToken = response.refreshToken;
    this.scope = response.scope;
    this.state = response.state;
    this.idToken = response.idToken;
    this.issuedAt = response.issuedAt ?? getCurrentTimeInSeconds();
  }

  private applyResponseConfig(response: TokenResponseConfig) {
    this.accessToken = response.accessToken ?? this.accessToken;
    this.tokenType = response.tokenType ?? this.tokenType ?? 'bearer';
    this.expiresIn = response.expiresIn ?? this.expiresIn;
    this.refreshToken = response.refreshToken ?? this.refreshToken;
    this.scope = response.scope ?? this.scope;
    this.state = response.state ?? this.state;
    this.idToken = response.idToken ?? this.idToken;
    this.issuedAt = response.issuedAt ?? this.issuedAt ?? getCurrentTimeInSeconds();
  }

  getRequestConfig(): TokenResponseConfig {
    return {
      accessToken: this.accessToken,
      idToken: this.idToken,
      refreshToken: this.refreshToken,
      scope: this.scope,
      state: this.state,
      tokenType: this.tokenType,
      issuedAt: this.issuedAt,
      expiresIn: this.expiresIn,
    };
  }

  async refreshAsync(
    config: Omit<TokenRequestConfig, 'grantType' | 'refreshToken'>,
    discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>
  ): Promise<TokenResponse> {
    const request = new RefreshTokenRequest({
      ...config,
      refreshToken: this.refreshToken,
    });
    const response = await request.performAsync(discovery);
    // Custom: reuse the refresh token if one wasn't returned
    response.refreshToken = response.refreshToken ?? this.refreshToken;
    const json = response.getRequestConfig();
    this.applyResponseConfig(json);
    return this;
  }

  shouldRefresh(): boolean {
    // no refresh token available and token has expired
    return !(TokenResponse.isTokenFresh(this) || !this.refreshToken);
  }
}

class Request<T, B> {
  constructor(protected request: T) {}

  async performAsync(discovery: ServiceConfig.DiscoveryDocument): Promise<B> {
    throw new Error('performAsync must be extended');
  }

  getRequestConfig(): T {
    throw new Error('getRequestConfig must be extended');
  }

  getQueryBody(): Record<string, string> {
    throw new Error('getQueryBody must be extended');
  }
}

/**
 * A generic token request.
 */
class TokenRequest<T extends TokenRequestConfig> extends Request<T, TokenResponse> {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly scopes?: string[];
  readonly extraParams?: Record<string, string>;

  constructor(request, public grantType: GrantType) {
    super(request);
    this.clientId = request.clientId;
    this.clientSecret = request.clientSecret;
    this.extraParams = request.extraParams;
    this.scopes = request.scopes;
  }

  getHeaders(): Headers {
    const headers: Headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (typeof this.clientSecret !== 'undefined') {
      // If client secret exists, it should be converted to base64
      // https://tools.ietf.org/html/rfc6749#section-2.3.1
      const encodedClientId = encodeURIComponent(this.clientId);
      const encodedClientSecret = encodeURIComponent(this.clientSecret);
      const credentials = `${encodedClientId}:${encodedClientSecret}`;
      const basicAuth = Base64.encodeNoWrap(credentials);
      headers.Authorization = `Basic ${basicAuth}`;
    }

    return headers;
  }

  async performAsync(discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>) {
    // redirect URI must not be nil
    invariant(
      discovery.tokenEndpoint,
      `Cannot invoke \`performAsync()\` without a valid tokenEndpoint`
    );
    const response = await requestAsync<ServerTokenResponseConfig | ResponseErrorConfig>(
      discovery.tokenEndpoint,
      {
        dataType: 'json',
        method: 'POST',
        headers: this.getHeaders(),
        body: this.getQueryBody(),
      }
    );

    if ('error' in response) {
      throw new TokenError(response);
    }

    return new TokenResponse({
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
      refreshToken: response.refresh_token,
      scope: response.scope,
      idToken: response.id_token,
      issuedAt: response.issued_at,
    });
  }

  getQueryBody() {
    const queryBody: Record<string, string> = {
      grant_type: this.grantType,
    };

    if (!this.clientSecret) {
      // Only add the client ID if client secret is not present, otherwise pass the client id with the secret in the request body.
      queryBody.client_id = this.clientId;
    }

    if (this.scopes) {
      queryBody.scope = this.scopes.join(' ');
    }

    if (this.extraParams) {
      for (const extra in this.extraParams) {
        if (extra in this.extraParams && !(extra in queryBody)) {
          queryBody[extra] = this.extraParams[extra];
        }
      }
    }
    return queryBody;
  }
}

/**
 * Access token request. Exchange an authorization code for a user access token.
 *
 * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
 */
export class AccessTokenRequest
  extends TokenRequest<AccessTokenRequestConfig>
  implements AccessTokenRequestConfig
{
  readonly code: string;
  readonly redirectUri: string;

  constructor(options: AccessTokenRequestConfig) {
    invariant(
      options.redirectUri,
      `\`AccessTokenRequest\` requires a valid \`redirectUri\` (it must also match the one used in the auth request). Example: ${Platform.select(
        {
          web: 'https://yourwebsite.com/redirect',
          default: 'myapp://redirect',
        }
      )}`
    );

    invariant(
      options.code,
      `\`AccessTokenRequest\` requires a valid authorization \`code\`. This is what's received from the authorization server after an auth request.`
    );
    super(options, GrantType.AuthorizationCode);
    this.code = options.code;
    this.redirectUri = options.redirectUri;
  }

  getQueryBody() {
    const queryBody: Record<string, string> = super.getQueryBody();

    if (this.redirectUri) {
      queryBody.redirect_uri = this.redirectUri;
    }

    if (this.code) {
      queryBody.code = this.code;
    }

    return queryBody;
  }

  getRequestConfig() {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: this.grantType,
      code: this.code,
      redirectUri: this.redirectUri,
      extraParams: this.extraParams,
      scopes: this.scopes,
    };
  }
}

/**
 * Refresh request.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 */
export class RefreshTokenRequest
  extends TokenRequest<RefreshTokenRequestConfig>
  implements RefreshTokenRequestConfig
{
  readonly refreshToken?: string;

  constructor(options: RefreshTokenRequestConfig) {
    invariant(options.refreshToken, `\`RefreshTokenRequest\` requires a valid \`refreshToken\`.`);
    super(options, GrantType.RefreshToken);
    this.refreshToken = options.refreshToken;
  }

  getQueryBody() {
    const queryBody = super.getQueryBody();

    if (this.refreshToken) {
      queryBody.refresh_token = this.refreshToken;
    }

    return queryBody;
  }

  getRequestConfig() {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: this.grantType,
      refreshToken: this.refreshToken,
      extraParams: this.extraParams,
      scopes: this.scopes,
    };
  }
}

/**
 * Revocation request for a given token.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export class RevokeTokenRequest
  extends Request<RevokeTokenRequestConfig, boolean>
  implements RevokeTokenRequestConfig
{
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly token: string;
  readonly tokenTypeHint?: TokenTypeHint;

  constructor(request: RevokeTokenRequestConfig) {
    super(request);
    invariant(request.token, `\`RevokeTokenRequest\` requires a valid \`token\` to revoke.`);
    this.clientId = request.clientId;
    this.clientSecret = request.clientSecret;
    this.token = request.token;
    this.tokenTypeHint = request.tokenTypeHint;
  }

  getHeaders(): Headers {
    const headers: Headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (typeof this.clientSecret !== 'undefined' && this.clientId) {
      // If client secret exists, it should be converted to base64
      // https://tools.ietf.org/html/rfc6749#section-2.3.1
      const encodedClientId = encodeURIComponent(this.clientId);
      const encodedClientSecret = encodeURIComponent(this.clientSecret);
      const credentials = `${encodedClientId}:${encodedClientSecret}`;
      const basicAuth = Base64.encodeNoWrap(credentials);
      headers.Authorization = `Basic ${basicAuth}`;
    }

    return headers;
  }

  /**
   * Perform a token revocation request.
   *
   * @param discovery The `revocationEndpoint` for a provider.
   */
  async performAsync(discovery: Pick<ServiceConfig.DiscoveryDocument, 'revocationEndpoint'>) {
    invariant(
      discovery.revocationEndpoint,
      `Cannot invoke \`performAsync()\` without a valid revocationEndpoint`
    );
    await requestAsync<boolean>(discovery.revocationEndpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: this.getQueryBody(),
    });

    return true;
  }

  getRequestConfig() {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      token: this.token,
      tokenTypeHint: this.tokenTypeHint,
    };
  }

  getQueryBody(): Record<string, string> {
    const queryBody: Record<string, string> = { token: this.token };
    if (this.tokenTypeHint) {
      queryBody.token_type_hint = this.tokenTypeHint;
    }
    // Include client creds https://tools.ietf.org/html/rfc6749#section-2.3.1
    if (this.clientId) {
      queryBody.client_id = this.clientId;
    }
    if (this.clientSecret) {
      queryBody.client_secret = this.clientSecret;
    }
    return queryBody;
  }
}

// @needsAudit
/**
 * Exchange an authorization code for an access token that can be used to get data from the provider.
 *
 * @param config Configuration used to exchange the code for a token.
 * @param discovery The `tokenEndpoint` for a provider.
 * @return Returns a discovery document with a valid `tokenEndpoint` URL.
 */
export function exchangeCodeAsync(
  config: AccessTokenRequestConfig,
  discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>
): Promise<TokenResponse> {
  const request = new AccessTokenRequest(config);
  return request.performAsync(discovery);
}

// @needsAudit
/**
 * Refresh an access token.
 * - If the provider didn't return a `refresh_token` then the access token may not be refreshed.
 * - If the provider didn't return a `expires_in` then it's assumed that the token does not expire.
 * - Determine if a token needs to be refreshed via `TokenResponse.isTokenFresh()` or `shouldRefresh()` on an instance of `TokenResponse`.
 *
 * @see [Section 6](https://tools.ietf.org/html/rfc6749#section-6).
 *
 * @param config Configuration used to refresh the given access token.
 * @param discovery The `tokenEndpoint` for a provider.
 * @return Returns a discovery document with a valid `tokenEndpoint` URL.
 */
export function refreshAsync(
  config: RefreshTokenRequestConfig,
  discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>
): Promise<TokenResponse> {
  const request = new RefreshTokenRequest(config);
  return request.performAsync(discovery);
}

// @needsAudit
/**
 * Revoke a token with a provider. This makes the token unusable, effectively requiring the user to login again.
 *
 * @param config Configuration used to revoke a refresh or access token.
 * @param discovery The `revocationEndpoint` for a provider.
 * @return Returns a discovery document with a valid `revocationEndpoint` URL. Many providers do not support this feature.
 */
export function revokeAsync(
  config: RevokeTokenRequestConfig,
  discovery: Pick<ServiceConfig.DiscoveryDocument, 'revocationEndpoint'>
): Promise<boolean> {
  const request = new RevokeTokenRequest(config);
  return request.performAsync(discovery);
}

/**
 * Fetch generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * @see [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo).
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export function fetchUserInfoAsync(
  config: Pick<TokenResponse, 'accessToken'>,
  discovery: Pick<ServiceConfig.DiscoveryDocument, 'userInfoEndpoint'>
): Promise<Record<string, any>> {
  if (!discovery.userInfoEndpoint) {
    throw new Error('User info endpoint is not defined in the service config discovery document');
  }
  return requestAsync<Record<string, any>>(discovery.userInfoEndpoint, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${config.accessToken}`,
    },
    dataType: 'json',
    method: 'GET',
  });
}
