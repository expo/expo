import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, ResponseType } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument } from './Discovery';
declare type AuthDiscoveryDocument = Pick<DiscoveryDocument, 'authorizationEndpoint'>;
/**
 * Implements an authorization request.
 * [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1)
 */
export declare class AuthRequest {
    /**
     * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state: Promise<string> | string;
    url: string | null;
    codeVerifier?: string;
    readonly responseType: ResponseType;
    readonly clientId: string;
    readonly extraParams: Record<string, string>;
    readonly usePKCE?: boolean;
    readonly codeChallengeMethod: CodeChallengeMethod;
    readonly redirectUri: string;
    private readonly scopes;
    private readonly clientSecret?;
    private codeChallenge?;
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
    promptAsync(discovery: AuthDiscoveryDocument, { url, ...options }?: AuthRequestPromptOptions): Promise<AuthSessionResult>;
    parseReturnUrl(url: string): AuthSessionResult;
    /**
     * Create the URL for authorization.
     *
     * @param discovery
     */
    buildUrlAsync(discovery: AuthDiscoveryDocument): Promise<string>;
    private getStateAsync;
    private ensureCodeIsSetupAsync;
}
export {};
