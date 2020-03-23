import { GRANT_TYPE_REFRESH_TOKEN } from '@openid/appauth';
import { ExpoTokenRequest } from './ExpoTokenRequest';
/**
 * Represents a refresh token request.
 * This is a utility class created for parity with `ExpoRevokeTokenRequest`.
 */
export class ExpoRefreshTokenRequest extends ExpoTokenRequest {
    constructor(options) {
        super({
            grant_type: GRANT_TYPE_REFRESH_TOKEN,
            code: options.code,
            refresh_token: options.refreshToken,
            redirect_uri: options.redirectUri,
            client_id: options.clientId,
            extras: options.extras,
            client_secret: options.clientSecret,
            scope: Array.isArray(options.scopes) ? options.scopes.join(' ') : undefined,
            code_verifier: options.codeVerifier,
        });
    }
}
//# sourceMappingURL=ExpoRefreshTokenRequest.js.map