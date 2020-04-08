import { AuthSessionResult } from './AuthSession.types';
import { Discovery } from './Discovery';
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
    discovery?: Discovery;
    issuer?: string;
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
    private issuer?;
    discovery?: Discovery;
    constructor(request: AuthRequestConfig);
    getAuthRequestConfigAsync(): Promise<AuthRequestConfig>;
    performAsync(options: {
        useProxy?: boolean;
        showInRecents?: boolean;
        useRedirect?: boolean;
    }): Promise<AuthSessionResult>;
    performWithUrlAsync(url: string, options: {
        useProxy?: boolean;
        showInRecents?: boolean;
        useRedirect?: boolean;
    }): Promise<AuthSessionResult>;
    parseReturnUrlAsync(url: string): Promise<AuthSessionResult>;
    buildUrlAsync(): Promise<string>;
    private getStateAsync;
    getDiscoveryAsync(): Promise<Discovery>;
    private cacheAsync;
    deletePendingAuthRequestAsync(): Promise<boolean>;
    private ensureCodeIsSetupAsync;
}
export declare function maybeCompleteAuthRequestAfterRedirectAsync(urlString?: string): Promise<AuthSessionResult | null>;
