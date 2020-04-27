export var TokenTypeHint;
(function (TokenTypeHint) {
    TokenTypeHint["RefreshToken"] = "refresh_token";
    TokenTypeHint["AccessToken"] = "access_token";
})(TokenTypeHint || (TokenTypeHint = {}));
/**
 * Grant type values used in dynamic client registration and auth requests.
 *
 * [OAuth2 spec](https://tools.ietf.org/html/rfc6749)
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
})(GrantType || (GrantType = {}));
//# sourceMappingURL=TokenRequest.types.js.map