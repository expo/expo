import invariant from 'invariant';
import { Platform } from 'react-native';
import * as Base64 from './Base64';
import { TokenError } from './Errors';
import { requestAsync } from './Fetch';
import { GrantType, } from './TokenRequest.types';
/**
 * Returns the current time in seconds.
 */
export function getCurrentTimeInSeconds() {
    return Math.floor(Date.now() / 1000);
}
/**
 * Token Response.
 *
 * [Section 5.1](https://tools.ietf.org/html/rfc6749#section-5.1)
 */
export class TokenResponse {
    /**
     * Determines whether a token refresh request must be made to refresh the tokens
     *
     * @param token
     * @param secondsMargin
     */
    static isTokenFresh(token, 
    /**
     * -10 minutes in seconds
     */
    secondsMargin = 60 * 10 * -1) {
        if (!token) {
            return false;
        }
        if (token.expiresIn) {
            const now = getCurrentTimeInSeconds();
            return now < token.issuedAt + token.expiresIn + secondsMargin;
        }
        // if there is no expiration time but we have an access token, it is assumed to never expire
        return true;
    }
    /**
     * Creates a `TokenResponse` from query parameters returned from an `AuthRequest`.
     *
     * @param params
     */
    static fromQueryParams(params) {
        return new TokenResponse({
            accessToken: params.access_token,
            refreshToken: params.refresh_token,
            scope: params.scope,
            state: params.state,
            idToken: params.id_token,
            tokenType: params.token_type,
            expiresIn: params.expires_in,
            issuedAt: params.issued_at,
        });
    }
    accessToken;
    tokenType;
    expiresIn;
    refreshToken;
    scope;
    state;
    idToken;
    issuedAt;
    constructor(response) {
        this.accessToken = response.accessToken;
        this.tokenType = response.tokenType ?? 'bearer';
        this.expiresIn = response.expiresIn;
        this.refreshToken = response.refreshToken;
        this.scope = response.scope;
        this.state = response.state;
        this.idToken = response.idToken;
        this.issuedAt = response.issuedAt ?? getCurrentTimeInSeconds();
    }
    applyResponseConfig(response) {
        this.accessToken = response.accessToken ?? this.accessToken;
        this.tokenType = response.tokenType ?? this.tokenType ?? 'bearer';
        this.expiresIn = response.expiresIn ?? this.expiresIn;
        this.refreshToken = response.refreshToken ?? this.refreshToken;
        this.scope = response.scope ?? this.scope;
        this.state = response.state ?? this.state;
        this.idToken = response.idToken ?? this.idToken;
        this.issuedAt = response.issuedAt ?? this.issuedAt ?? getCurrentTimeInSeconds();
    }
    getRequestConfig() {
        return {
            accessToken: this.accessToken,
            idToken: this.idToken,
            refreshToken: this.refreshToken,
            scope: this.scope,
            state: this.state,
            tokenType: this.tokenType,
            issuedAt: this.issuedAt,
            expiresIn: this.expiresIn,
        };
    }
    async refreshAsync(config, discovery) {
        const request = new RefreshTokenRequest({
            ...config,
            refreshToken: this.refreshToken,
        });
        const response = await request.performAsync(discovery);
        // Custom: reuse the refresh token if one wasn't returned
        response.refreshToken = response.refreshToken ?? this.refreshToken;
        const json = response.getRequestConfig();
        this.applyResponseConfig(json);
        return this;
    }
    shouldRefresh() {
        // no refresh token available and token has expired
        return !(TokenResponse.isTokenFresh(this) || !this.refreshToken);
    }
}
class Request {
    request;
    constructor(request) {
        this.request = request;
    }
    async performAsync(discovery) {
        throw new Error('performAsync must be extended');
    }
    getRequestConfig() {
        throw new Error('getRequestConfig must be extended');
    }
    getQueryBody() {
        throw new Error('getQueryBody must be extended');
    }
}
/**
 * A generic token request.
 */
class TokenRequest extends Request {
    grantType;
    clientId;
    clientSecret;
    scopes;
    extraParams;
    constructor(request, grantType) {
        super(request);
        this.grantType = grantType;
        this.clientId = request.clientId;
        this.clientSecret = request.clientSecret;
        this.extraParams = request.extraParams;
        this.scopes = request.scopes;
    }
    getHeaders() {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        if (typeof this.clientSecret !== 'undefined') {
            // If client secret exists, it should be converted to base64
            // https://tools.ietf.org/html/rfc6749#section-2.3.1
            const encodedClientId = encodeURIComponent(this.clientId);
            const encodedClientSecret = encodeURIComponent(this.clientSecret);
            const credentials = `${encodedClientId}:${encodedClientSecret}`;
            const basicAuth = Base64.encodeNoWrap(credentials);
            headers.Authorization = `Basic ${basicAuth}`;
        }
        return headers;
    }
    async performAsync(discovery) {
        // redirect URI must not be nil
        invariant(discovery.tokenEndpoint, `Cannot invoke \`performAsync()\` without a valid tokenEndpoint`);
        const response = await requestAsync(discovery.tokenEndpoint, {
            dataType: 'json',
            method: 'POST',
            headers: this.getHeaders(),
            body: this.getQueryBody(),
        });
        if ('error' in response) {
            throw new TokenError(response);
        }
        return new TokenResponse({
            accessToken: response.access_token,
            tokenType: response.token_type,
            expiresIn: response.expires_in,
            refreshToken: response.refresh_token,
            scope: response.scope,
            idToken: response.id_token,
            issuedAt: response.issued_at,
        });
    }
    getQueryBody() {
        const queryBody = {
            grant_type: this.grantType,
        };
        if (!this.clientSecret) {
            // Only add the client ID if client secret is not present, otherwise pass the client id with the secret in the request body.
            queryBody.client_id = this.clientId;
        }
        if (this.scopes) {
            queryBody.scope = this.scopes.join(' ');
        }
        if (this.extraParams) {
            for (const extra in this.extraParams) {
                if (extra in this.extraParams && !(extra in queryBody)) {
                    queryBody[extra] = this.extraParams[extra];
                }
            }
        }
        return queryBody;
    }
}
/**
 * Access token request. Exchange an authorization code for a user access token.
 *
 * [Section 4.1.3](https://tools.ietf.org/html/rfc6749#section-4.1.3)
 */
export class AccessTokenRequest extends TokenRequest {
    code;
    redirectUri;
    constructor(options) {
        invariant(options.redirectUri, `\`AccessTokenRequest\` requires a valid \`redirectUri\` (it must also match the one used in the auth request). Example: ${Platform.select({
            web: 'https://yourwebsite.com/redirect',
            default: 'myapp://redirect',
        })}`);
        invariant(options.code, `\`AccessTokenRequest\` requires a valid authorization \`code\`. This is what's received from the authorization server after an auth request.`);
        super(options, GrantType.AuthorizationCode);
        this.code = options.code;
        this.redirectUri = options.redirectUri;
    }
    getQueryBody() {
        const queryBody = super.getQueryBody();
        if (this.redirectUri) {
            queryBody.redirect_uri = this.redirectUri;
        }
        if (this.code) {
            queryBody.code = this.code;
        }
        return queryBody;
    }
    getRequestConfig() {
        return {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            grantType: this.grantType,
            code: this.code,
            redirectUri: this.redirectUri,
            extraParams: this.extraParams,
            scopes: this.scopes,
        };
    }
}
/**
 * Refresh request.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 */
export class RefreshTokenRequest extends TokenRequest {
    refreshToken;
    constructor(options) {
        invariant(options.refreshToken, `\`RefreshTokenRequest\` requires a valid \`refreshToken\`.`);
        super(options, GrantType.RefreshToken);
        this.refreshToken = options.refreshToken;
    }
    getQueryBody() {
        const queryBody = super.getQueryBody();
        if (this.refreshToken) {
            queryBody.refresh_token = this.refreshToken;
        }
        return queryBody;
    }
    getRequestConfig() {
        return {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            grantType: this.grantType,
            refreshToken: this.refreshToken,
            extraParams: this.extraParams,
            scopes: this.scopes,
        };
    }
}
/**
 * Revocation request for a given token.
 *
 * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
 */
export class RevokeTokenRequest extends Request {
    clientId;
    clientSecret;
    token;
    tokenTypeHint;
    constructor(request) {
        super(request);
        invariant(request.token, `\`RevokeTokenRequest\` requires a valid \`token\` to revoke.`);
        this.clientId = request.clientId;
        this.clientSecret = request.clientSecret;
        this.token = request.token;
        this.tokenTypeHint = request.tokenTypeHint;
    }
    getHeaders() {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        if (typeof this.clientSecret !== 'undefined' && this.clientId) {
            // If client secret exists, it should be converted to base64
            // https://tools.ietf.org/html/rfc6749#section-2.3.1
            const encodedClientId = encodeURIComponent(this.clientId);
            const encodedClientSecret = encodeURIComponent(this.clientSecret);
            const credentials = `${encodedClientId}:${encodedClientSecret}`;
            const basicAuth = Base64.encodeNoWrap(credentials);
            headers.Authorization = `Basic ${basicAuth}`;
        }
        return headers;
    }
    /**
     * Perform a token revocation request.
     *
     * @param discovery The `revocationEndpoint` for a provider.
     */
    async performAsync(discovery) {
        invariant(discovery.revocationEndpoint, `Cannot invoke \`performAsync()\` without a valid revocationEndpoint`);
        await requestAsync(discovery.revocationEndpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: this.getQueryBody(),
        });
        return true;
    }
    getRequestConfig() {
        return {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            token: this.token,
            tokenTypeHint: this.tokenTypeHint,
        };
    }
    getQueryBody() {
        const queryBody = { token: this.token };
        if (this.tokenTypeHint) {
            queryBody.token_type_hint = this.tokenTypeHint;
        }
        // Include client creds https://tools.ietf.org/html/rfc6749#section-2.3.1
        if (this.clientId) {
            queryBody.client_id = this.clientId;
        }
        if (this.clientSecret) {
            queryBody.client_secret = this.clientSecret;
        }
        return queryBody;
    }
}
/**
 * Exchange an auth code for an access token that can be used to get data from the provider.
 *
 * @param config
 * @param discovery The `tokenEndpoint` for a provider.
 */
export function exchangeCodeAsync(config, discovery) {
    const request = new AccessTokenRequest(config);
    return request.performAsync(discovery);
}
/**
 * Refresh an access token. Often this just requires the `refreshToken` and `scopes` parameters.
 *
 * [Section 6](https://tools.ietf.org/html/rfc6749#section-6)
 *
 * @param config
 * @param discovery The `tokenEndpoint` for a provider.
 */
export function refreshAsync(config, discovery) {
    const request = new RefreshTokenRequest(config);
    return request.performAsync(discovery);
}
/**
 * Revoke a token with a provider.
 * This makes the token unusable, effectively requiring the user to login again.
 *
 * @param config
 * @param discovery The `revocationEndpoint` for a provider.
 */
export function revokeAsync(config, discovery) {
    const request = new RevokeTokenRequest(config);
    return request.performAsync(discovery);
}
/**
 * Fetch generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export function fetchUserInfoAsync(config, discovery) {
    if (!discovery.userInfoEndpoint) {
        throw new Error('User info endpoint is not defined in the service config discovery document');
    }
    return requestAsync(discovery.userInfoEndpoint, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${config.accessToken}`,
        },
        dataType: 'json',
        method: 'GET',
    });
}
//# sourceMappingURL=TokenRequest.js.map