import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery } from './Discovery';
export declare enum CodeChallengeMethod {
    S256 = "S256",
    Plain = "plain"
}
/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * https://tools.ietf.org/html/rfc6749#section-3.1.1
 */
export declare enum ResponseType {
    /**
     * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
     */
    Code = "code",
    /**
     * for requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
     */
    Token = "token"
}
export declare type AuthRequestPromptOptions = {
    url?: string;
    useProxy?: boolean;
    showInRecents?: boolean;
};
export interface AuthRequestConfig {
    responseType: ResponseType;
    clientId: string;
    /**
     * https://tools.ietf.org/html/rfc6749#section-3.1.2
     */
    redirectUri: string;
    scopes: string[];
    clientSecret?: string;
    codeChallengeMethod: CodeChallengeMethod;
    codeChallenge?: string;
    state?: string;
    extraParams?: Record<string, string>;
    usePKCE?: boolean;
}
export declare type AuthResponse = {
    code: string;
    state: string;
};
/**
 * Represents the authorization request.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export declare class AuthRequest {
    static buildAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
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
    /**
     * Used for protection against [Cross-Site Request Forgery](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state: Promise<string> | string;
    constructor(request: AuthRequestConfig);
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
    promptAsync(discovery: Discovery, { url, ...options }: AuthRequestPromptOptions): Promise<AuthSessionResult>;
    parseReturnUrlAsync(url: string): Promise<AuthSessionResult>;
    buildUrlAsync(discovery: Discovery): Promise<string>;
    private getStateAsync;
    private ensureCodeIsSetupAsync;
}
