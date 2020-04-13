export var CodeChallengeMethod;
(function (CodeChallengeMethod) {
    /**
     * The default and recommended method for transforming the code verifier.
     * 1. Convert the code verifier to ASCII.
     * 2. Create a digest of the string using crypto method SHA256.
     * 3. Convert the digest to Base64 and URL encode it.
     */
    CodeChallengeMethod["S256"] = "S256";
    /**
     * This should not be used.
     * When used, the code verifier will be sent to the server as-is.
     */
    CodeChallengeMethod["Plain"] = "plain";
})(CodeChallengeMethod || (CodeChallengeMethod = {}));
/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * [Section 3.1.1](https://tools.ietf.org/html/rfc6749#section-3.1.1)
 */
export var ResponseType;
(function (ResponseType) {
    /**
     * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
     */
    ResponseType["Code"] = "code";
    /**
     * For requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
     */
    ResponseType["Token"] = "token";
})(ResponseType || (ResponseType = {}));
//# sourceMappingURL=AuthRequest.types.js.map