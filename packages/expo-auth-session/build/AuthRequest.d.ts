import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, ResponseType, Prompt } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument } from './Discovery';
declare type AuthDiscoveryDocument = Pick<DiscoveryDocument, 'authorizationEndpoint'>;
/**
 * Used to manage an authorization request according to the OAuth spec: [Section 4.1.1][https://tools.ietf.org/html/rfc6749#section-4.1.1].
 * You can use this class directly for more info around the authorization.
 *
 * **Common use-cases:**
 *
 * - Parse a URL returned from the authorization server with `parseReturnUrlAsync()`.
 * - Get the built authorization URL with `makeAuthUrlAsync()`.
 * - Get a loaded JSON representation of the auth request with crypto state loaded with `getAuthRequestConfigAsync()`.
 *
 * @example
 * ```ts
 * // Create a request.
 * const request = new AuthRequest({ ... });
 *
 * // Prompt for an auth code
 * const result = await request.promptAsync(discovery, { useProxy: true });
 *
 * // Get the URL to invoke
 * const url = await request.makeAuthUrlAsync(discovery);
 *
 * // Get the URL to invoke
 * const parsed = await request.parseReturnUrlAsync("<URL From Server>");
 * ```
 */
export declare class AuthRequest implements Omit<AuthRequestConfig, 'state'> {
    /**
     * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state: string;
    url: string | null;
    codeVerifier?: string;
    codeChallenge?: string;
    readonly responseType: ResponseType | string;
    readonly clientId: string;
    readonly extraParams: Record<string, string>;
    readonly usePKCE?: boolean;
    readonly codeChallengeMethod: CodeChallengeMethod;
    readonly redirectUri: string;
    readonly scopes?: string[];
    readonly clientSecret?: string;
    readonly prompt?: Prompt;
    constructor(request: AuthRequestConfig);
    /**
     * Load and return a valid auth request based on the input config.
     */
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
    /**
     * Prompt a user to authorize for a code.
     *
     * @param discovery
     * @param promptOptions
     */
    promptAsync(discovery: AuthDiscoveryDocument, { url, proxyOptions, ...options }?: AuthRequestPromptOptions): Promise<AuthSessionResult>;
    parseReturnUrl(url: string): AuthSessionResult;
    /**
     * Create the URL for authorization.
     *
     * @param discovery
     */
    makeAuthUrlAsync(discovery: AuthDiscoveryDocument): Promise<string>;
    private ensureCodeIsSetupAsync;
}
export {};
//# sourceMappingURL=AuthRequest.d.ts.map