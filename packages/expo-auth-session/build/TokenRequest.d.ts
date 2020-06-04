import * as ServiceConfig from './Discovery';
import { GrantType, RevokeTokenRequestConfig, TokenRequestConfig, TokenResponseConfig, TokenType, TokenTypeHint, RefreshTokenRequestConfig, AccessTokenRequestConfig } from './TokenRequest.types';
/**
 * Token Response.
 *
 * [Section 5.1](https://tools.ietf.org/html/rfc6749#section-5.1)
 */
export declare class TokenResponse implements TokenResponseConfig {
    /**
     * Determines whether a token refresh request must be made to refresh the tokens
     *
     * @param token
     * @param secondsMargin
     */
    static isTokenFresh(token: Pick<TokenResponse, 'expiresIn' | 'issuedAt' | 'accessToken'>, 
    /**
     * -10 minutes in seconds
     */
    secondsMargin?: number): boolean;
    accessToken: string;
    tokenType: TokenType;
    expiresIn?: number;
    refreshToken?: string;
    scope?: string;
    state?: string;
    idToken?: string;
    issuedAt: number;
    constructor(response: TokenResponseConfig);
    private applyResponseConfig;
    getRequestConfig(): TokenResponseConfig;
    refreshAsync(config: Omit<TokenRequestConfig, 'grantType' | 'refreshToken'>, discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>): Promise<TokenResponse>;
    shouldRefresh(): boolean;
}
declare class Request<T, B> {
    protected request: T;
    constructor(request: T);
    performAsync(discovery: ServiceConfig.DiscoveryDocument): Promise<B>;
    getRequestConfig(): T;
    getQueryBody(): Record<string, string>;
}
/**
 * A generic token request.
 */
declare class TokenRequest<T extends TokenRequestConfig> extends Request<T, TokenResponse> {
    grantType: GrantType;
    readonly clientId: string;
    readonly clientSecret?: string;
    readonly scopes?: string[];
    readonly extraParams?: Record<string, string>;
    constructor(request: any, grantType: GrantType);
    private getHeaders;
    performAsync(discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>): Promise<TokenResponse>;
    getQueryBody(): Record<string, string>;
}
/**
 * Access token request. Exchange an authorization code for a user access token.
 *
 * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
 */
export declare class AccessTokenRequest extends TokenRequest<AccessTokenRequestConfig> implements AccessTokenRequestConfig {
    readonly code: string;
    readonly redirectUri: string;
    readonly codeVerifier?: string;
    constructor(options: AccessTokenRequestConfig);
    getQueryBody(): Record<string, string>;
}
/**
 * Refresh request.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 */
export declare class RefreshTokenRequest extends TokenRequest<RefreshTokenRequestConfig> implements RefreshTokenRequestConfig {
    readonly refreshToken?: string;
    constructor(options: RefreshTokenRequestConfig);
    getQueryBody(): Record<string, string>;
}
/**
 * Revocation request for a given token.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export declare class RevokeTokenRequest extends Request<RevokeTokenRequestConfig, boolean> implements RevokeTokenRequestConfig {
    readonly clientId?: string;
    readonly clientSecret?: string;
    readonly token: string;
    readonly tokenTypeHint?: TokenTypeHint;
    constructor(request: RevokeTokenRequestConfig);
    private getHeaders;
    /**
     * Perform a token revocation request.
     *
     * @param discovery The `revocationEndpoint` for a provider.
     */
    performAsync(discovery: Pick<ServiceConfig.DiscoveryDocument, 'revocationEndpoint'>): Promise<boolean>;
    getRequestConfig(): {
        clientId: string | undefined;
        clientSecret: string | undefined;
        token: string;
        tokenTypeHint: TokenTypeHint | undefined;
    };
    getQueryBody(): Record<string, string>;
}
/**
 * Exchange an auth code for an access token that can be used to get data from the provider.
 *
 * @param config
 * @param discovery The `tokenEndpoint` for a provider.
 */
export declare function exchangeCodeAsync(config: AccessTokenRequestConfig, discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>): Promise<TokenResponse>;
/**
 * Refresh an access token. Often this just requires the `refreshToken` and `scopes` parameters.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 *
 * @param config
 * @param discovery The `tokenEndpoint` for a provider.
 */
export declare function refreshAsync(config: RefreshTokenRequestConfig, discovery: Pick<ServiceConfig.DiscoveryDocument, 'tokenEndpoint'>): Promise<TokenResponse>;
/**
 * Revoke a token with a provider.
 * This makes the token unusable, effectively requiring the user to login again.
 *
 * @param config
 * @param discovery The `revocationEndpoint` for a provider.
 */
export declare function revokeAsync(config: RevokeTokenRequestConfig, discovery: Pick<ServiceConfig.DiscoveryDocument, 'revocationEndpoint'>): Promise<boolean>;
/**
 * Request generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export declare function requestUserInfoAsync(config: Pick<TokenResponse, 'accessToken'>, discovery: Pick<ServiceConfig.DiscoveryDocument, 'userInfoEndpoint'>): Promise<Record<string, any>>;
export {};
