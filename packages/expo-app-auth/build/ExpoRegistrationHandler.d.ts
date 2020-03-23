import { QueryStringUtils, Requestor, StringMap, TokenError, TokenErrorJson } from '@openid/appauth';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
import GrantType from './GrantType';
export declare type ExpoRegistrationErrorJson = TokenErrorJson;
export declare class ExpoRegistrationError extends TokenError {
}
export declare type ExpoRegistrationResponseJson = {
    client_id_issued_at: number;
    client_secret_expires_at: number;
    client_id: string;
    client_secret: string;
    registration_access_token: string;
    registration_client_uri: string;
    extras: StringMap;
};
export declare class ExpoRegistrationResponse {
    clientIDIssuedAt: number;
    clientSecretExpiresAt: number;
    clientID: string;
    clientSecret: string;
    registrationAccessToken: string;
    registrationClientURI: string;
    extras: StringMap;
    constructor(options: ExpoRegistrationResponseJson);
    toJson(): {
        client_id_issued_at: number;
        client_secret_expires_at: number;
        client_id: string;
        client_secret: string;
        registration_access_token: string;
        registration_client_uri: string;
    };
}
export interface ExpoRegistrationRequestJson {
    /**
     * Client's redirect URI's
     *
     * https://tools.ietf.org/html/rfc6749#section-3.1.2
     */
    redirect_uris: string[];
    /**
     * Response types to use.
     *
     * [OpenID Connect Core 1.0, Section 3](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3)
     */
    response_types: string[];
    /**
     * Grant types to use.
     *
     * [OpenID Connect Dynamic Client Registration 1.0, Section 2](https://openid.net/specs/openid-connect-discovery-1_0.html#rfc.section.2)
     */
    grant_types: GrantType[];
    /**
     * Subject type to use.
     *
     * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
     */
    subject_type?: string;
    /**
     * Client auth method to use at the token endpoint.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    token_endpoint_auth_method?: string;
    initial_access_token?: string;
    extras?: Record<string, any>;
}
export declare type ExpoRegistrationApplicationType = 'web' | 'native';
export declare class ExpoRegistrationRequest {
    /**
     * Instructs the authorization server to generate a pairwise subject identifier.
     *
     * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
     */
    static SUBJECT_TYPE_PAIRWISE: string;
    /**
     * Instructs the authorization server to generate a public subject identifier.
     *
     * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
     */
    static SUBJECT_TYPE_PUBLIC: string;
    redirectURIs: string[];
    responseTypes: string[];
    grantTypes: GrantType[];
    subjectType?: string;
    tokenEndpointAuthMethod?: string;
    initialAccessToken?: string;
    extras?: Record<string, any>;
    /**
     * Must always be native
     * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
     */
    applicationType: ExpoRegistrationApplicationType;
    constructor(options: ExpoRegistrationRequestJson);
    toJson(): {
        redirect_uris: string;
        response_types: string;
        grant_types: string;
        subject_type: string;
        application_type: ExpoRegistrationApplicationType;
        token_endpoint_auth_method: string;
        initial_access_token: string;
    };
    toStringMap(): StringMap;
}
export declare class ExpoRegistrationHandler {
    requestor: Requestor;
    utils: QueryStringUtils;
    constructor(requestor?: Requestor, utils?: QueryStringUtils);
    private isRegistrationResponse;
    performRegistrationRequest(configuration: ExpoAuthorizationServiceConfiguration, request: ExpoRegistrationRequest): Promise<ExpoRegistrationResponse>;
}
