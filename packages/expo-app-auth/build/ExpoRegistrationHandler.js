import { AppAuthError, BasicQueryStringUtils, TokenError, } from '@openid/appauth';
import { Platform } from 'react-native';
import { ExpoRequestor } from './ExpoRequestor';
export class ExpoRegistrationError extends TokenError {
}
export class ExpoRegistrationResponse {
    constructor(options) {
        this.clientIDIssuedAt = options.client_id_issued_at;
        this.clientSecretExpiresAt = options.client_secret_expires_at;
        this.clientID = options.client_id;
        this.clientSecret = options.client_secret;
        this.registrationAccessToken = options.registration_access_token;
        this.registrationClientURI = options.registration_client_uri;
        this.extras = options.extras;
    }
    toJson() {
        return {
            client_id_issued_at: this.clientIDIssuedAt,
            client_secret_expires_at: this.clientSecretExpiresAt,
            client_id: this.clientID,
            client_secret: this.clientSecret,
            registration_access_token: this.registrationAccessToken,
            registration_client_uri: this.registrationClientURI,
        };
    }
}
export class ExpoRegistrationRequest {
    constructor(options) {
        /**
         * Must always be native
         * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
         */
        this.applicationType = Platform.select({
            web: 'web',
            default: 'native',
        });
        this.redirectURIs = options.redirect_uris;
        this.responseTypes = options.response_types;
        this.grantTypes = options.grant_types;
        this.subjectType = options.subject_type;
        this.tokenEndpointAuthMethod = options.token_endpoint_auth_method;
        this.initialAccessToken = options.initial_access_token;
        this.extras = options.extras;
    }
    toJson() {
        return {
            redirect_uris: this.redirectURIs.join(' '),
            response_types: this.responseTypes.join(' '),
            grant_types: this.grantTypes.join(' '),
            subject_type: this.subjectType || '',
            application_type: this.applicationType || '',
            token_endpoint_auth_method: this.tokenEndpointAuthMethod || '',
            initial_access_token: this.initialAccessToken || '',
        };
    }
    toStringMap() {
        const map = this.toJson();
        // copy over extras
        if (this.extras) {
            for (let extra in this.extras) {
                if (extra in this.extras && !(extra in map)) {
                    // check before inserting to requestMap
                    map[extra] = this.extras[extra];
                }
            }
        }
        return map;
    }
}
/**
 * Instructs the authorization server to generate a pairwise subject identifier.
 *
 * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
 */
ExpoRegistrationRequest.SUBJECT_TYPE_PAIRWISE = 'pairwise';
/**
 * Instructs the authorization server to generate a public subject identifier.
 *
 * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
 */
ExpoRegistrationRequest.SUBJECT_TYPE_PUBLIC = 'public';
export class ExpoRegistrationHandler {
    constructor(requestor = new ExpoRequestor(), utils = new BasicQueryStringUtils()) {
        this.requestor = requestor;
        this.utils = utils;
    }
    isRegistrationResponse(response) {
        return response.error === undefined;
    }
    async performRegistrationRequest(configuration, request) {
        if (!configuration.registrationEndpoint) {
            throw new ExpoRegistrationError({
                error_description: 'The registration request could not be created because the registration URL is missing.',
                error: 'invalid_request',
            });
        }
        const response = await this.requestor.xhr({
            url: configuration.registrationEndpoint,
            method: 'POST',
            dataType: 'json',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: this.utils.stringify(request.toStringMap()),
        });
        if (this.isRegistrationResponse(response)) {
            return new ExpoRegistrationResponse(response);
        }
        throw new AppAuthError(response.error, new ExpoRegistrationError(response));
    }
}
//# sourceMappingURL=ExpoRegistrationHandler.js.map