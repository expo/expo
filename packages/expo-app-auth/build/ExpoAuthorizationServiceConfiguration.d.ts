import { AuthorizationServiceConfiguration, Requestor } from '@openid/appauth';
/**
 * Represents AuthorizationServiceConfiguration as a user-friendly JSON object.
 * Adds support for dynamic URI registration.
 */
export interface ExpoAuthorizationServiceConfigurationJson {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint?: string;
    userInfoEndpoint?: string;
    endSessionEndpoint?: string;
    /**
     * The dynamic client registration endpoint URI.
     */
    registrationEndpoint?: string;
}
export declare type DiscoveryDocument = Record<string, string | boolean | string[]> & {
    authorization_endpoint?: string;
    token_endpoint?: string;
    revocation_endpoint?: string;
    userinfo_endpoint?: string;
    end_session_endpoint?: string;
    claims_supported?: string[];
    check_session_iframe?: string;
    backchannel_logout_supported?: boolean;
    backchannel_logout_session_supported?: boolean;
    code_challenge_methods_supported?: string[];
    device_authorization_endpoint?: string;
    frontchannel_logout_session_supported?: boolean;
    frontchannel_logout_supported?: boolean;
    grant_types_supported?: string[];
    id_token_signing_alg_values_supported?: string[];
    introspection_endpoint?: string;
    issuer?: string;
    jwks_uri?: string;
    request_parameter_supported?: boolean;
    response_modes_supported?: string[];
    scopes_supported?: string[];
    subject_types_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
};
/**
 * Configuration details required to interact with an authorization service.
 * Expo adds support for discoveryDocument
 *
 * More information at https://openid.net/specs/openid-connect-discovery-1_0-17.html
 */
export declare class ExpoAuthorizationServiceConfiguration extends AuthorizationServiceConfiguration {
    discoveryDocument: DiscoveryDocument;
    registrationEndpoint?: string;
    constructor({ authorizationEndpoint: authorization_endpoint, tokenEndpoint: token_endpoint, revocationEndpoint: revocation_endpoint, userInfoEndpoint: userinfo_endpoint, endSessionEndpoint: end_session_endpoint, registrationEndpoint, ...request }: ExpoAuthorizationServiceConfigurationJson);
    toJson(): DiscoveryDocument;
    static fetchFromIssuer(openIdIssuerUrl: string, requestor?: Requestor): Promise<ExpoAuthorizationServiceConfiguration>;
}
