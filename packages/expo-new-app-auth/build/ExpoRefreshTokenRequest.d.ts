import { StringMap } from '@openid/appauth';
import { ExpoTokenRequest } from './ExpoTokenRequest';
/**
 * Represents the Token Request as user-friendly JSON.
 */
export interface ExpoRefreshTokenRequestJson {
    code?: string;
    refreshToken?: string;
    redirectUri: string;
    clientId: string;
    extras?: StringMap;
    clientSecret?: string;
    scopes?: string[];
    codeVerifier?: string;
}
/**
 * Represents a refresh token request.
 * This is a utility class created for parity with `ExpoRevokeTokenRequest`.
 */
export declare class ExpoRefreshTokenRequest extends ExpoTokenRequest {
    constructor(options: ExpoRefreshTokenRequestJson);
}
