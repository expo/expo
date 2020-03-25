import { AppAuthError, BaseTokenRequestHandler, BasicQueryStringUtils, TokenError, TokenResponse, } from '@openid/appauth';
import { encodeBase64NoWrap } from './ExpoCrypto';
import { ExpoRequestor } from './ExpoRequestor';
import { ExpoTokenRequest } from './ExpoTokenRequest';
/**
 * The default token request handler.
 */
export class ExpoTokenRequestHandler extends BaseTokenRequestHandler {
    constructor(requestor = new ExpoRequestor(), utils = new BasicQueryStringUtils()) {
        super(requestor, utils);
    }
    async performRevokeTokenRequest(configuration, request) {
        if (!configuration.revocationEndpoint) {
            throw new Error(`Cannot revoke token without a valid \`revocationEndpoint\` in the authorization service configuration.`);
        }
        await this.requestor.xhr({
            url: configuration.revocationEndpoint,
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: this.utils.stringify(request.toStringMap()),
        });
        return true;
    }
    getHeaders(request) {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        // From the OAuth2 RFC, client ID and secret should be encoded prior to concatenation and
        // conversion to Base64: https://tools.ietf.org/html/rfc6749#section-2.3.1
        if (request instanceof ExpoTokenRequest && typeof request.clientSecret !== 'undefined') {
            const encodedClientId = encodeURIComponent(request.clientId);
            const encodedClientSecret = encodeURIComponent(request.clientSecret);
            const credentials = `${encodedClientId}:${encodedClientSecret}`;
            const basicAuth = encodeBase64NoWrap(credentials);
            headers.Authorization = `Basic ${basicAuth}`;
        }
        return headers;
    }
    async performTokenRequest(configuration, request) {
        const response = await this.requestor.xhr({
            url: configuration.tokenEndpoint,
            method: 'POST',
            dataType: 'json',
            headers: this.getHeaders(request),
            data: this.utils.stringify(request.toStringMap()),
        });
        if (isTokenResponse(response)) {
            return new TokenResponse(response);
        }
        throw new AppAuthError(response.error, new TokenError(response));
    }
}
function isTokenResponse(response) {
    return response.error === undefined;
}
//# sourceMappingURL=ExpoTokenRequestHandler.js.map