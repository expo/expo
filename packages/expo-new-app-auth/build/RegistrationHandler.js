import { AppAuthError, BasicQueryStringUtils, TokenError, } from '@openid/appauth';
import { Platform } from 'react-native';
import { ExpoRequestor } from './ExpoRequestor';
export class RegistrationError extends TokenError {
}
export class RegistrationResponse {
    constructor(options) {
        this.clientIdIssuedAt = options.client_id_issued_at;
        this.clientSecretExpiresAt = options.client_secret_expires_at;
        this.clientId = options.client_id;
        this.clientSecret = options.client_secret;
        this.registrationAccessToken = options.registration_access_token;
        this.registrationClientUri = options.registration_client_uri;
        this.extras = options.extras;
    }
    toJson() {
        return {
            client_id_issued_at: this.clientIdIssuedAt,
            client_secret_expires_at: this.clientSecretExpiresAt,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            registration_access_token: this.registrationAccessToken,
            registration_client_uri: this.registrationClientUri,
        };
    }
}
export class RegistrationRequest {
    constructor(options) {
        /**
         * Must always be native
         * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
         */
        this.applicationType = Platform.select({
            web: 'web',
            default: 'native',
        });
        this.redirectUris = options.redirect_uris;
        this.responseTypes = options.response_types;
        this.grantTypes = options.grant_types;
        this.subjectType = options.subject_type;
        this.tokenEndpointAuthMethod = options.token_endpoint_auth_method;
        this.initialAccessToken = options.initial_access_token;
        this.extras = options.extras;
    }
    toJson() {
        return {
            redirect_uris: (this.redirectUris ?? []).join(' '),
            response_types: (this.responseTypes ?? []).join(' '),
            grant_types: (this.grantTypes ?? []).join(' '),
            subject_type: this.subjectType ?? '',
            application_type: this.applicationType,
            token_endpoint_auth_method: this.tokenEndpointAuthMethod ?? '',
            initial_access_token: this.initialAccessToken ?? '',
        };
    }
    toStringMap() {
        const { redirect_uris, response_types, grant_types, subject_type, application_type, token_endpoint_auth_method, } = this.toJson();
        const map = {
            redirect_uris,
            application_type,
        };
        // Add extras first to allow them
        // to be overwritten by request json
        if (this.extras) {
            for (const extra in this.extras) {
                if (extra in this.extras && !(extra in map)) {
                    // check before inserting to requestMap
                    map[extra] = this.extras[extra];
                }
            }
        }
        if (response_types) {
            map.response_types = response_types;
        }
        if (grant_types) {
            map.grant_types = grant_types;
        }
        if (subject_type) {
            map.subject_type = subject_type;
        }
        if (token_endpoint_auth_method) {
            map.token_endpoint_auth_method = token_endpoint_auth_method;
        }
        return map;
    }
}
/**
 * Instructs the authorization server to generate a pairwise subject identifier.
 *
 * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
 */
RegistrationRequest.SUBJECT_TYPE_PAIRWISE = 'pairwise';
/**
 * Instructs the authorization server to generate a public subject identifier.
 *
 * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
 */
RegistrationRequest.SUBJECT_TYPE_PUBLIC = 'public';
/**
 * Clients that have received a client_secret value from the Authorization Server authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] using the HTTP Basic authentication scheme.
 *
 * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
 */
RegistrationRequest.CLIENT_AUTH_CLIENT_SECRET_BASIC = 'client_secret_basic';
/**
 * Clients that have received a client_secret value from the Authorization Server, authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] by including the Client Credentials in the request body.
 *
 * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
 */
RegistrationRequest.CLIENT_AUTH_CLIENT_SECRET_POST = 'client_secret_post';
/**
 * Clients that have received a client_secret value from the Authorization Server create a JWT using an HMAC SHA algorithm, such as HMAC SHA-256. The HMAC (Hash-based Message Authentication Code) is calculated using the octets of the UTF-8 representation of the client_secret as the shared key.
 *
 * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
 */
RegistrationRequest.CLIENT_AUTH_CLIENT_SECRET_JWT = 'client_secret_jwt';
/**
 * Clients that have registered a public key sign a JWT using that key.
 *
 * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
 */
RegistrationRequest.CLIENT_AUTH_PRIVATE_KEY_JWT = 'private_key_jwt';
/**
 * The Client does not authenticate itself at the Token Endpoint, either because it uses only the Implicit Flow (and so does not use the Token Endpoint) or because it is a Public Client with no Client Secret or other authentication mechanism.
 *
 * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
 */
RegistrationRequest.CLIENT_AUTH_NONE = 'none';
export class RegistrationHandler {
    constructor(requestor = new ExpoRequestor(), utils = new BasicQueryStringUtils()) {
        this.requestor = requestor;
        this.utils = utils;
    }
    isRegistrationResponse(response) {
        return response.error === undefined;
    }
    getHeaders(request) {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        // From the OAuth2 RFC, client ID and secret should be encoded prior to concatenation and
        // conversion to Base64: https://tools.ietf.org/html/rfc6749#section-2.3.1
        if (typeof request.initialAccessToken !== 'undefined') {
            const encodedInitialAccessToken = encodeURIComponent(request.initialAccessToken);
            headers.Authorization = `Bearer ${encodedInitialAccessToken}`;
        }
        return headers;
    }
    async performRegistrationRequest(configuration, request) {
        if (!configuration.registrationEndpoint) {
            throw new RegistrationError({
                error_description: 'The registration request could not be created because the registration URL is missing.',
                error: 'invalid_request',
            });
        }
        const response = await this.requestor.xhr({
            url: configuration.registrationEndpoint,
            method: 'POST',
            dataType: 'json',
            headers: this.getHeaders(request),
            data: this.utils.stringify(request.toStringMap()),
        });
        if (this.isRegistrationResponse(response)) {
            return new RegistrationResponse(response);
        }
        throw new AppAuthError(response.error, new RegistrationError(response));
    }
}
//# sourceMappingURL=RegistrationHandler.js.map