/**
 * Access token type
 *
 * [Section 7.1](https://tools.ietf.org/html/rfc6749#section-7.1)
 */
export declare type TokenType = 'bearer' | 'mac';
export interface ServerTokenResponseConfig {
    access_token: string;
    token_type?: TokenType;
    /**
     * Time in seconds
     */
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    /**
     * [TokenResponse](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse)
     */
    id_token?: string;
    issued_at?: number;
}
export interface TokenResponseConfig {
    accessToken: string;
    tokenType?: TokenType;
    /**
     * Time in seconds
     */
    expiresIn?: number;
    refreshToken?: string;
    scope?: string;
    /**
     * [TokenResponse](https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse)
     */
    idToken?: string;
    issuedAt?: number;
}
export declare enum TokenTypeHint {
    RefreshToken = "refresh_token",
    AccessToken = "access_token"
}
interface CommonTokenRequest {
    clientId: string;
    clientSecret?: string;
}
export interface TokenRequestConfig extends CommonTokenRequest {
    grantType: GrantType;
    code?: string;
    refreshToken?: string;
    redirectUri: string;
    extraParams?: Record<string, string>;
    scope?: string;
    codeVerifier?: string;
}
export interface RevokeTokenRequestConfig extends Partial<CommonTokenRequest> {
    token: string;
    tokenTypeHint?: TokenTypeHint;
}
export interface AccessTokenRequestConfig extends TokenRequestConfig {
    scopes?: string[];
}
export interface RefreshTokenRequestConfig extends TokenRequestConfig {
    scopes?: string[];
}
/**
 * Grant type values used in dynamic client registration and auth requests.
 *
 * [OAuth2 spec](https://tools.ietf.org/html/rfc6749)
 */
export declare enum GrantType {
    /**
     * Used for exchanging an authorization code for one or more tokens.
     *
     * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
     */
    AuthorizationCode = "authorization_code",
    /**
     * Used when obtaining an access token.
     *
     * [Section 4.2](https://tools.ietf.org/html/rfc6749#section-4.2)
     */
    Implicit = "implicit",
    /**
     * Used when exchanging a refresh token for a new token.
     *
     * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
     */
    RefreshToken = "refresh_token"
}
export {};
