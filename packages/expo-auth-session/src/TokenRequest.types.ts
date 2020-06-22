/**
 * Access token type
 *
 * [Section 7.1](https://tools.ietf.org/html/rfc6749#section-7.1)
 */
export type TokenType = 'bearer' | 'mac';

/**
 * A hint about the type of the token submitted for revocation.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export enum TokenTypeHint {
  /**
   * Access token.
   *
   * [Section 1.4](https://tools.ietf.org/html/rfc6749#section-1.4)
   */
  AccessToken = 'access_token',
  /**
   * Refresh token.
   *
   * [Section 1.5](https://tools.ietf.org/html/rfc6749#section-1.5)
   */
  RefreshToken = 'refresh_token',
}

/**
 * Config used to request a token refresh, revocation, or code exchange.
 */
export interface TokenRequestConfig {
  /**
   * A unique string representing the registration information provided by the client.
   * The client identifier is not a secret; it is exposed to the resource owner and shouldn't be used
   * alone for client authentication.
   *
   * The client identifier is unique to the authorization server.
   *
   * [Section 2.2](https://tools.ietf.org/html/rfc6749#section-2.2)
   */
  clientId: string;
  /**
   * Client secret supplied by an auth provider.
   * There is no secure way to store this on the client.
   *
   * [Section 2.3.1](https://tools.ietf.org/html/rfc6749#section-2.3.1)
   */
  clientSecret?: string;
  /**
   * Extra query params that'll be added to the query string.
   */
  extraParams?: Record<string, string>;
  /**
   * List of strings to request access to.
   *
   * [Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)
   */
  scopes?: string[];
}

/**
 * Config used to exchange an authorization code for an access token.
 *
 * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
 */
export interface AccessTokenRequestConfig extends TokenRequestConfig {
  /**
   * The authorization code received from the authorization server.
   */
  code: string;
  /**
   * If the `redirectUri` parameter was included in the `AuthRequest`, then it must be supplied here as well.
   *
   * [Section 3.1.2](https://tools.ietf.org/html/rfc6749#section-3.1.2)
   */
  redirectUri: string;
}

/**
 * Config used to request a token refresh, or code exchange.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 */
export interface RefreshTokenRequestConfig extends TokenRequestConfig {
  /**
   * The refresh token issued to the client.
   */
  refreshToken?: string;
}

/**
 * Config used to revoke a token.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export interface RevokeTokenRequestConfig extends Partial<TokenRequestConfig> {
  /**
   * The token that the client wants to get revoked.
   */
  token: string;
  /**
   * A hint about the type of the token submitted for revocation.
   */
  tokenTypeHint?: TokenTypeHint;
}

/**
 * Grant type values used in dynamic client registration and auth requests.
 *
 * [Appendix A.10](https://tools.ietf.org/html/rfc6749#appendix-A.10)
 */
export enum GrantType {
  /**
   * Used for exchanging an authorization code for one or more tokens.
   *
   * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
   */
  AuthorizationCode = 'authorization_code',
  /**
   * Used when obtaining an access token.
   *
   * [Section 4.2](https://tools.ietf.org/html/rfc6749#section-4.2)
   */
  Implicit = 'implicit',
  /**
   * Used when exchanging a refresh token for a new token.
   *
   * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
   */
  RefreshToken = 'refresh_token',
  /**
   * Used for client credentials flow.
   *
   * [Section 4.4.2](https://tools.ietf.org/html/rfc6749#section-4.4.2)
   */
  ClientCredentials = 'client_credentials',
}

/**
 * Object returned from the server after a token response.
 */
export interface ServerTokenResponseConfig {
  access_token: string;
  token_type?: TokenType;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  issued_at?: number;
}

export interface TokenResponseConfig {
  /**
   * The access token issued by the authorization server.
   *
   * [Section 4.2.2](https://tools.ietf.org/html/rfc6749#section-4.2.2)
   */
  accessToken: string;
  /**
   * The type of the token issued. Value is case insensitive.
   *
   * [Section 7.1](https://tools.ietf.org/html/rfc6749#section-7.1)
   */
  tokenType?: TokenType;
  /**
   * The lifetime in seconds of the access token.
   *
   * For example, the value `3600` denotes that the access token will
   * expire in one hour from the time the response was generated.
   *
   * If omitted, the authorization server should provide the
   * expiration time via other means or document the default value.
   *
   * [Section 4.2.2](https://tools.ietf.org/html/rfc6749#section-4.2.2)
   */
  expiresIn?: number;
  /**
   * The refresh token, which can be used to obtain new access tokens using the same authorization grant.
   *
   * [Section 5.1](https://tools.ietf.org/html/rfc6749#section-5.1)
   */
  refreshToken?: string;
  /**
   * The scope of the access token. Only required if it's different to the scope that was requested by the client.
   *
   * [Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)
   */
  scope?: string;
  /**
   * Required if the "state" parameter was present in the client
   * authorization request.  The exact value received from the client.
   *
   * [Section 4.2.2](https://tools.ietf.org/html/rfc6749#section-4.2.2)
   */
  state?: string;
  /**
   * ID Token value associated with the authenticated session.
   *
   * [TokenResponse](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse)
   */
  idToken?: string;
  /**
   * Time in seconds when the token was received by the client.
   */
  issuedAt?: number;
}
