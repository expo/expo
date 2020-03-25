import { GRANT_TYPE_AUTHORIZATION_CODE } from '@openid/appauth';
import invariant from 'invariant';
import { ExpoTokenRequest } from './ExpoTokenRequest';
import { Platform } from 'react-native';
/**
 * Represents an access token request.
 * This is a utility class created for parity with `ExpoRevokeTokenRequest`.
 */
export class ExpoAccessTokenRequest extends ExpoTokenRequest {
    constructor(options) {
        invariant(options.redirectUri, `\`ExpoAccessTokenRequest\` requires a valid \`redirectUri\`. Example: ${Platform.select({
            web: 'https://yourwebsite.com/',
            default: 'com.your.app:/oauthredirect',
        })}`);
        super({
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
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
//# sourceMappingURL=ExpoAccessTokenRequest.js.map