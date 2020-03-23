import { AuthorizationServiceConfiguration, } from '@openid/appauth';
import { ExpoRequestor } from './ExpoRequestor';
/**
 * The standard base path for well-known resources on domains.
 * See https://tools.ietf.org/html/rfc5785 for more information.
 */
const WELL_KNOWN_PATH = '.well-known';
/**
 * The standard resource under the well known path at which an OpenID Connect
 * discovery document can be found under an issuer's base URI.
 */
const OPENID_CONFIGURATION = 'openid-configuration';
/**
 * Configuration details required to interact with an authorization service.
 * Expo adds support for discoveryDocument
 *
 * More information at https://openid.net/specs/openid-connect-discovery-1_0-17.html
 */
export class ExpoAuthorizationServiceConfiguration extends AuthorizationServiceConfiguration {
    constructor({ authorizationEndpoint: authorization_endpoint, tokenEndpoint: token_endpoint, revocationEndpoint: revocation_endpoint, userInfoEndpoint: userinfo_endpoint, endSessionEndpoint: end_session_endpoint, registrationEndpoint, ...request }) {
        super({
            authorization_endpoint,
            token_endpoint,
            // @ts-ignore: A useful error will be thrown if you try to revoke a token without an endpoint.
            revocation_endpoint,
            userinfo_endpoint,
            end_session_endpoint,
        });
        this.discoveryDocument = {
            ...request,
            authorization_endpoint,
            token_endpoint,
            revocation_endpoint,
            userinfo_endpoint,
            end_session_endpoint,
        };
        this.registrationEndpoint = registrationEndpoint;
    }
    // @ts-ignore: Invalid extension
    toJson() {
        return this.discoveryDocument;
    }
    static async fetchFromIssuer(openIdIssuerUrl, requestor) {
        const fullUrl = `${openIdIssuerUrl}/${WELL_KNOWN_PATH}/${OPENID_CONFIGURATION}`;
        const requestorToUse = requestor || new ExpoRequestor();
        const { authorization_endpoint, token_endpoint, revocation_endpoint, userinfo_endpoint, end_session_endpoint, registration_endpoint, ...json } = (await requestorToUse.xhr({
            url: fullUrl,
            dataType: 'json',
            method: 'GET',
        }));
        return new ExpoAuthorizationServiceConfiguration({
            ...json,
            authorizationEndpoint: authorization_endpoint,
            tokenEndpoint: token_endpoint,
            revocationEndpoint: revocation_endpoint,
            userInfoEndpoint: userinfo_endpoint,
            endSessionEndpoint: end_session_endpoint,
            registrationEndpoint: registration_endpoint,
        });
    }
}
//# sourceMappingURL=ExpoAuthorizationServiceConfiguration.js.map