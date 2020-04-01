import { QueryStringUtils, Requestor, StringMap, TokenError, TokenErrorJson } from '@openid/appauth';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
import GrantType from './GrantType';
export declare type RegistrationErrorJson = TokenErrorJson;
export declare class RegistrationError extends TokenError {
}
export declare type RegistrationResponseJson = {
    client_id_issued_at?: number;
    client_secret_expires_at?: number;
    client_id: string;
    client_secret?: string;
    registration_access_token: string;
    registration_client_uri: string;
    extras: StringMap;
};
export declare class RegistrationResponse {
    clientIdIssuedAt?: number;
    clientSecretExpiresAt?: number;
    clientId: string;
    clientSecret?: string;
    registrationAccessToken: string;
    registrationClientUri: string;
    extras: StringMap;
    constructor(options: RegistrationResponseJson);
    toJson(): {
        client_id_issued_at: number | undefined;
        client_secret_expires_at: number | undefined;
        client_id: string;
        client_secret: string | undefined;
        registration_access_token: string;
        registration_client_uri: string;
    };
}
export interface RegistrationRequestJson {
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
    grant_types?: GrantType[];
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
    /**
     * The initial access token to access the Client Registration Endpoint (if required by the OpenID Provider).
     * OAuth 2.0 Access Token optionally issued by an Authorization Server granting
     * access to its Client Registration Endpoint. This token (if required) is
     * provisioned out of band.
     *
     * [Section 3 of OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html#ClientRegistration)
     */
    initial_access_token?: string;
    extras?: Record<string, any>;
}
export declare type RegistrationApplicationType = 'web' | 'native' | 'browser' | 'service';
export declare class RegistrationRequest {
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
    /**
     * Clients that have received a client_secret value from the Authorization Server authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] using the HTTP Basic authentication scheme.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    static CLIENT_AUTH_CLIENT_SECRET_BASIC: string;
    /**
     * Clients that have received a client_secret value from the Authorization Server, authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] by including the Client Credentials in the request body.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    static CLIENT_AUTH_CLIENT_SECRET_POST: string;
    /**
     * Clients that have received a client_secret value from the Authorization Server create a JWT using an HMAC SHA algorithm, such as HMAC SHA-256. The HMAC (Hash-based Message Authentication Code) is calculated using the octets of the UTF-8 representation of the client_secret as the shared key.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    static CLIENT_AUTH_CLIENT_SECRET_JWT: string;
    /**
     * Clients that have registered a public key sign a JWT using that key.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    static CLIENT_AUTH_PRIVATE_KEY_JWT: string;
    /**
     * The Client does not authenticate itself at the Token Endpoint, either because it uses only the Implicit Flow (and so does not use the Token Endpoint) or because it is a Public Client with no Client Secret or other authentication mechanism.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    static CLIENT_AUTH_NONE: string;
    redirectUris: string[];
    responseTypes: string[];
    grantTypes?: GrantType[];
    subjectType?: string;
    tokenEndpointAuthMethod?: string;
    initialAccessToken?: string;
    extras?: Record<string, any>;
    /**
     * Must always be native
     * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
     */
    applicationType: RegistrationApplicationType;
    constructor(options: RegistrationRequestJson);
    toJson(): {
        redirect_uris: string;
        response_types: string;
        grant_types: string;
        subject_type: string;
        application_type: RegistrationApplicationType;
        token_endpoint_auth_method: string;
        initial_access_token: string;
    };
    toStringMap(): StringMap;
}
export declare class RegistrationHandler {
    requestor: Requestor;
    utils: QueryStringUtils;
    constructor(requestor?: Requestor, utils?: QueryStringUtils);
    protected isRegistrationResponse(response: RegistrationResponseJson | RegistrationErrorJson): response is RegistrationResponseJson;
    protected getHeaders(request: RegistrationRequest): StringMap;
    performRegistrationRequest(configuration: ExpoAuthorizationServiceConfiguration, request: RegistrationRequest): Promise<RegistrationResponse>;
}
