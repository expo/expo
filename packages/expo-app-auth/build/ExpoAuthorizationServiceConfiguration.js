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
 * Extends AuthorizationServiceConfiguration adding support for discoveryDocument
 */
export class ExpoAuthorizationServiceConfiguration extends AuthorizationServiceConfiguration {
    constructor(request) {
        super(request);
        this.discoveryDocument = request;
    }
    // @ts-ignore
    toJson() {
        return this.discoveryDocument;
    }
    static fetchFromIssuer(openIdIssuerUrl, requestor) {
        const fullUrl = `${openIdIssuerUrl}/${WELL_KNOWN_PATH}/${OPENID_CONFIGURATION}`;
        const requestorToUse = requestor || new ExpoRequestor();
        return requestorToUse
            .xhr({ url: fullUrl, dataType: 'json', method: 'GET' })
            .then(json => new ExpoAuthorizationServiceConfiguration(json));
    }
}
//# sourceMappingURL=ExpoAuthorizationServiceConfiguration.js.map