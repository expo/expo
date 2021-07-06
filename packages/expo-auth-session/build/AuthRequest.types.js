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
    /**
     * A custom registered type for getting an `id_token` from Google OAuth.
     */
    ResponseType["IdToken"] = "id_token";
})(ResponseType || (ResponseType = {}));
/**
 * Should the user be prompted to login or consent again.
 * This can be used to present a dialog for switching accounts after the user has already been logged in.
 *
 * [Section 3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationRequest)
 */
export var Prompt;
(function (Prompt) {
    /**
     * Server must not display any auth or consent UI. Can be used to check for existing auth or consent.
     * An error is returned if a user isn't already authenticated or the client doesn't have pre-configured consent for the requested claims, or does not fulfill other conditions for processing the request.
     * The error code will typically be `login_required`, `interaction_required`, or another code defined in [Section 3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError).
     */
    Prompt["None"] = "none";
    /**
     * The server should prompt the user to reauthenticate.
     * If it cannot reauthenticate the End-User, it must return an error, typically `login_required`.
     */
    Prompt["Login"] = "login";
    /**
     * Server should prompt the user for consent before returning information to the client.
     * If it cannot obtain consent, it must return an error, typically `consent_required`.
     */
    Prompt["Consent"] = "consent";
    /**
     * Server should prompt the user to select an account. Can be used to switch accounts.
     * If it can't obtain an account selection choice made by the user, it must return an error, typically `account_selection_required`.
     */
    Prompt["SelectAccount"] = "select_account";
})(Prompt || (Prompt = {}));
//# sourceMappingURL=AuthRequest.types.js.map