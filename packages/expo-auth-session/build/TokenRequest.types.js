/**
 * A hint about the type of the token submitted for revocation.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export var TokenTypeHint;
(function (TokenTypeHint) {
    /**
     * Access token.
     *
     * [Section 1.4](https://tools.ietf.org/html/rfc6749#section-1.4)
     */
    TokenTypeHint["AccessToken"] = "access_token";
    /**
     * Refresh token.
     *
     * [Section 1.5](https://tools.ietf.org/html/rfc6749#section-1.5)
     */
    TokenTypeHint["RefreshToken"] = "refresh_token";
})(TokenTypeHint || (TokenTypeHint = {}));
/**
 * Grant type values used in dynamic client registration and auth requests.
 *
 * [Appendix A.10](https://tools.ietf.org/html/rfc6749#appendix-A.10)
 */
export var GrantType;
(function (GrantType) {
    /**
     * Used for exchanging an authorization code for one or more tokens.
     *
     * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
     */
    GrantType["AuthorizationCode"] = "authorization_code";
    /**
     * Used when obtaining an access token.
     *
     * [Section 4.2](https://tools.ietf.org/html/rfc6749#section-4.2)
     */
    GrantType["Implicit"] = "implicit";
    /**
     * Used when exchanging a refresh token for a new token.
     *
     * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
     */
    GrantType["RefreshToken"] = "refresh_token";
    /**
     * Used for client credentials flow.
     *
     * [Section 4.4.2](https://tools.ietf.org/html/rfc6749#section-4.4.2)
     */
    GrantType["ClientCredentials"] = "client_credentials";
})(GrantType || (GrantType = {}));
//# sourceMappingURL=TokenRequest.types.js.map