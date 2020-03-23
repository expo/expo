/**
 * The grant type values defined by the [OAuth2 spec](https://tools.ietf.org/html/rfc6749), and
 * used in {@link AuthorizationRequest authorization} and
 * {@link RegistrationRequest dynamic client registration} requests.
 */
var GrantType;
(function (GrantType) {
    /**
     * Used for exchanging an authorization code for one or more tokens.
     *
     * The OAuth 2.0 Authorization Framework (RFC 6749), Section 4.1.3
     * https://tools.ietf.org/html/rfc6749#section-4.1.3
     */
    GrantType["AuthorizationCode"] = "authorization_code";
    /**
     * Used when obtaining an access token.
     *
     * The OAuth 2.0 Authorization Framework (RFC 6749), Section 4.2
     * https://tools.ietf.org/html/rfc6749#section-4.2
     */
    GrantType["Implicit"] = "implicit";
    /**
     * Used when exchanging a refresh token for a new token.
     *
     * The OAuth 2.0 Authorization Framework (RFC 6749), Section 6
     * https://tools.ietf.org/html/rfc6749#section-6
     */
    GrantType["RefreshToken"] = "refresh_token";
})(GrantType || (GrantType = {}));
export default GrantType;
//# sourceMappingURL=GrantTypes.js.map