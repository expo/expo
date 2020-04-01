import { RevokeTokenRequest } from '@openid/appauth';
/**
 * Represents a revoke token request.
 * For more information look at:
 * https://tools.ietf.org/html/rfc7009#section-2.1
 */
export class ExpoRevokeTokenRequest extends RevokeTokenRequest {
    constructor(options) {
        super({
            token: options.token,
            token_type_hint: options.tokenTypeHint,
            client_id: options.clientId,
            client_secret: options.clientSecret,
        });
    }
}
//# sourceMappingURL=ExpoRevokeTokenRequest.js.map