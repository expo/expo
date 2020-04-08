export var CodeChallengeMethod;
(function (CodeChallengeMethod) {
    CodeChallengeMethod["S256"] = "S256";
    CodeChallengeMethod["Plain"] = "plain";
})(CodeChallengeMethod || (CodeChallengeMethod = {}));
/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * https://tools.ietf.org/html/rfc6749#section-3.1.1
 */
export var ResponseType;
(function (ResponseType) {
    /**
     * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
     */
    ResponseType["Code"] = "code";
    /**
     * for requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
     */
    ResponseType["Token"] = "token";
})(ResponseType || (ResponseType = {}));
//# sourceMappingURL=AuthRequest.types.js.map