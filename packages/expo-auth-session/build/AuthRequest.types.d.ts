export declare enum CodeChallengeMethod {
    /**
     * The default and recommended method for transforming the code verifier.
     * 1. Convert the code verifier to ASCII.
     * 2. Create a digest of the string using crypto method SHA256.
     * 3. Convert the digest to Base64 and URL encode it.
     */
    S256 = "S256",
    /**
     * This should not be used.
     * When used, the code verifier will be sent to the server as-is.
     */
    Plain = "plain"
}
/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * [Section 3.1.1](https://tools.ietf.org/html/rfc6749#section-3.1.1)
 */
export declare enum ResponseType {
    /**
     * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
     */
    Code = "code",
    /**
     * For requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
     */
    Token = "token"
}
export declare type AuthRequestPromptOptions = {
    url?: string;
    /**
     * Should the authentication request use the Expo proxy service `auth.expo.io`.
     * Default: `false`.
     */
    useProxy?: boolean;
    /**
     * Whether browsed website should be shown as separate entry in Android recents/multitasking view.
     * Default: `false`
     */
    showInRecents?: boolean;
};
/**
 * Represents an OAuth authorization request as JSON.
 */
export interface AuthRequestConfig {
    /**
     * Specifies what is returned from the authorization server.
     * [Section 3.1.1](https://tools.ietf.org/html/rfc6749#section-3.1.1)
     */
    responseType?: ResponseType;
    /**
     * A unique string representing the registration information provided by the client.
     * The client identifier is not a secret; it is exposed to the resource owner and shouldn't be used
     * alone for client authentication.
     *
     * The client identifier is unique to the authorization server.
     * [Section 2.2](https://tools.ietf.org/html/rfc6749#section-2.2)
     */
    clientId: string;
    /**
     * After completing an interaction with a resource owner the
     * server will redirect to this URI. Learn more about [linking in Expo](https://docs.expo.io/versions/latest/workflow/linking/).
     * [Section 3.1.2](https://tools.ietf.org/html/rfc6749#section-3.1.2)
     */
    redirectUri: string;
    /**
     * List of strings to request access to.
     * [Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)
     */
    scopes: string[];
    /**
     * Client secret supplied by an auth provider.
     * There is no secure way to store this on the client.
     * [Section 2.3.1](https://tools.ietf.org/html/rfc6749#section-2.3.1)
     */
    clientSecret?: string;
    /**
     * Method used to generate the code challenge.
     * Defaults to `S256`. You should never use `Plain` as it's not good enough for secure verification.
     */
    codeChallengeMethod?: CodeChallengeMethod;
    /**
     * Derived from the code verifier by using the `CodeChallengeMethod`.
     * [Section 4.2](https://tools.ietf.org/html/rfc7636#section-4.2)
     */
    codeChallenge?: string;
    /**
     * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state?: string;
    /**
     * Extra query params that'll be added to the query string.
     */
    extraParams?: Record<string, string>;
    /**
     * Should use [Proof Key for Code Exchange](https://oauth.net/2/pkce/).
     * Defaults to true.
     */
    usePKCE?: boolean;
}
