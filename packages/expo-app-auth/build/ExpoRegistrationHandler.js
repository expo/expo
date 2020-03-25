import { RegistrationHandler, RegistrationRequest, RegistrationResponse, } from './RegistrationHandler';
export class ExpoRegistrationResponse extends RegistrationResponse {
    constructor(options) {
        super({
            client_id_issued_at: options.clientIdIssuedAt,
            client_secret_expires_at: options.clientSecretExpiresAt,
            client_id: options.clientId,
            client_secret: options.clientSecret,
            registration_access_token: options.registrationAccessToken,
            registration_client_uri: options.registrationClientUri,
            extras: options.extras,
        });
    }
}
export class ExpoRegistrationRequest extends RegistrationRequest {
    constructor(options) {
        super({
            redirect_uris: options.redirectUris,
            response_types: options.responseTypes,
            grant_types: options.grantTypes,
            subject_type: options.subjectType,
            token_endpoint_auth_method: options.tokenEndpointAuthMethod,
            initial_access_token: options.initialAccessToken,
            extras: options.extras,
        });
    }
}
export class ExpoRegistrationHandler extends RegistrationHandler {
}
//# sourceMappingURL=ExpoRegistrationHandler.js.map