/**
 * Grant type values defined by the [OAuth2 spec](https://tools.ietf.org/html/rfc6749), and
 * used in authorization and dynamic client registration requests.
 */
enum GrantType {
  /**
   * Used for exchanging an authorization code for one or more tokens.
   *
   * The OAuth 2.0 Authorization Framework (RFC 6749), Section 4.1.3
   * https://tools.ietf.org/html/rfc6749#section-4.1.3
   */
  AuthorizationCode = 'authorization_code',
  /**
   * Used when obtaining an access token.
   *
   * The OAuth 2.0 Authorization Framework (RFC 6749), Section 4.2
   * https://tools.ietf.org/html/rfc6749#section-4.2
   */
  Implicit = 'implicit',
  /**
   * Used when exchanging a refresh token for a new token.
   *
   * The OAuth 2.0 Authorization Framework (RFC 6749), Section 6
   * https://tools.ietf.org/html/rfc6749#section-6
   */
  RefreshToken = 'refresh_token',
}

export default GrantType;
