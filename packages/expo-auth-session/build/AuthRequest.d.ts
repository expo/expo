import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, ResponseType } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery } from './Discovery';
/**
 * Represents the authorization request.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export declare class AuthRequest {
    static buildAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
    /**
     * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state: Promise<string> | string;
    responseType: ResponseType;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    clientSecret?: string;
    extraParams: Record<string, string>;
    usePKCE?: boolean;
    codeVerifier?: string;
    codeChallenge?: string;
    codeChallengeMethod: CodeChallengeMethod;
    url: string | null;
    constructor(request: AuthRequestConfig);
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
    promptAsync(discovery: Discovery, { url, ...options }?: AuthRequestPromptOptions): Promise<AuthSessionResult>;
    parseReturnUrlAsync(url: string): Promise<AuthSessionResult>;
    buildUrlAsync(discovery: Discovery): Promise<string>;
    private getStateAsync;
    private ensureCodeIsSetupAsync;
}
