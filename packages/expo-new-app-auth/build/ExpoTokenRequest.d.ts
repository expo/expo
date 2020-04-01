import { StringMap, TokenRequest, TokenRequestJson } from '@openid/appauth';
/**
 * Represents the Token Request as JSON.
 */
export interface ExpoTokenRequestJson extends TokenRequestJson {
    client_secret?: string;
    scope?: string;
    code_verifier?: string;
    grant_type: 'authorization_code' | 'refresh_token';
}
/**
 * Represents an Access Token request.
 * For more information look at:
 * https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
export declare class ExpoTokenRequest extends TokenRequest {
    clientSecret?: string;
    scope?: string;
    codeVerifier?: string;
    constructor(request: ExpoTokenRequestJson);
    toStringMap(): StringMap;
}
