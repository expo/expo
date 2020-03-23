import { RevokeTokenRequest, TokenTypeHint } from '@openid/appauth';
/**
 * Represents the Token Request as user-friendly JSON.
 */
export interface ExpoRevokeTokenRequestJson {
    token: string;
    tokenTypeHint?: TokenTypeHint;
    clientId?: string;
    clientSecret?: string;
}
/**
 * Represents a revoke token request.
 * For more information look at:
 * https://tools.ietf.org/html/rfc7009#section-2.1
 */
export declare class ExpoRevokeTokenRequest extends RevokeTokenRequest {
    constructor(options: ExpoRevokeTokenRequestJson);
}
