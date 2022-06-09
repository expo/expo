import { CodeChallengeMethod } from './AuthRequest.types';
/**
 * URL using the `https` scheme with no query or fragment component that the OP asserts as its Issuer Identifier.
 */
export declare type Issuer = string;
declare type ProviderMetadataEndpoints = {
    issuer?: Issuer;
    /**
     * URL of the OP's OAuth 2.0 Authorization Endpoint.
     */
    authorization_endpoint: string;
    /**
     * URL of the OP's OAuth 2.0 Token Endpoint.
     * This is required unless only the Implicit Flow is used.
     */
    token_endpoint: string;
    /**
     * URL of the OP's UserInfo Endpoint.
     */
    userinfo_endpoint?: string;
    revocation_endpoint?: string;
    registration_endpoint?: string;
    end_session_endpoint?: string;
    introspection_endpoint?: string;
    device_authorization_endpoint?: string;
};
/**
 * OpenID Providers have metadata describing their configuration.
 * [ProviderMetadata](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata)
 */
export declare type ProviderMetadata = Record<string, string | boolean | string[]> & ProviderMetadataEndpoints & {
    /**
     * URL of the OP's JSON Web Key Set [JWK](https://openid.net/specs/openid-connect-discovery-1_0.html#JWK) document.
     */
    jwks_uri?: string;
    /**
     * JSON array containing a list of the OAuth 2.0 [RFC6749](https://openid.net/specs/openid-connect-discovery-1_0.html#RFC6749)
     * scope values that this server supports.
     */
    scopes_supported?: string[];
    /**
     * JSON array containing a list of the OAuth 2.0 `response_type` values that this OP supports.
     * Dynamic OpenID Providers must support the `code`, `id_token`, and the `token` `id_token` Response Type values
     */
    response_types_supported?: string[];
    /**
     * JSON array containing a list of the OAuth 2.0 `response_mode` values that this OP supports,
     * as specified in [OAuth 2.0 Multiple Response Type Encoding Practices](https://openid.net/specs/openid-connect-discovery-1_0.html#OAuth.Responses).
     * If omitted, the default for Dynamic OpenID Providers is `["query", "fragment"]`.
     */
    response_modes_supported?: string[];
    /**
     * JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports.
     * Dynamic OpenID Providers MUST support the authorization_code and implicit Grant Type values and MAY support other Grant Types.
     * If omitted, the default value is ["authorization_code", "implicit"].
     */
    grant_types_supported?: string[];
    /**
     * JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for the ID Token to encode the Claims in a JWT.
     * The algorithm RS256 MUST be included.
     */
    id_token_signing_alg_values_supported?: string[];
    /**
     * JSON array containing a list of the Subject Identifier types that this OP supports.
     * Valid types include `pairwise` and `public`.
     */
    subject_types_supported?: string[];
    /**
     * A list of Client authentication methods supported by this Token Endpoint.
     * If omitted, the default is `['client_secret_basic']`
     */
    token_endpoint_auth_methods_supported?: ('client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'private_key_jwt' | string)[];
    /**
     *  a list of the `display` parameter values that the OpenID Provider supports.
     */
    display_values_supported?: string[];
    /**
     * a list of the Claim Types that the OpenID Provider supports.
     */
    claim_types_supported?: string[];
    /**
     * a list of the Claim Names of the Claims that the OpenID Provider may be able to supply values for.
     * Note that for privacy or other reasons, this might not be an exhaustive list.
     */
    claims_supported?: string[];
    /**
     * URL of a page containing human-readable information that developers might want or need to know when using the OpenID Provider.
     * In particular, if the OpenID Provider does not support Dynamic Client Registration, then information on how to register Clients
     * needs to be provided in this documentation.
     */
    service_documentation?: string;
    /**
     * Languages and scripts supported for values in Claims being returned.
     */
    claims_locales_supported?: string[];
    /**
     * Languages and scripts supported for the user interface,
     * represented as a JSON array of [BCP47](https://openid.net/specs/openid-connect-discovery-1_0.html#RFC5646) language tag values.
     */
    ui_locales_supported?: string[];
    /**
     * Boolean value specifying whether the OP supports use of the claims parameter, with `true` indicating support.
     * @default false
     */
    claims_parameter_supported?: boolean;
    /**
     * Boolean value specifying whether the OP supports use of the request parameter, with `true` indicating support.
     * @default false
     */
    request_parameter_supported?: boolean;
    /**
     * Whether the OP supports use of the `request_uri` parameter, with `true` indicating support.
     * @default true
     */
    request_uri_parameter_supported?: boolean;
    /**
     * Whether the OP requires any `request_uri` values used to be pre-registered using the `request_uris` registration parameter.
     * Pre-registration is required when the value is `true`.
     * @default false
     */
    require_request_uri_registration?: boolean;
    /**
     * URL that the OpenID Provider provides to the person registering the Client to read about the OP's requirements on how
     * the Relying Party can use the data provided by the OP. The registration process SHOULD display this URL to the person
     * registering the Client if it is given.
     */
    op_policy_uri?: string;
    /**
     * URL that the OpenID Provider provides to the person registering the Client to read about OpenID Provider's terms of service.
     * The registration process should display this URL to the person registering the Client if it is given.
     */
    op_tos_uri?: string;
    code_challenge_methods_supported?: CodeChallengeMethod[];
    check_session_iframe?: string;
    backchannel_logout_supported?: boolean;
    backchannel_logout_session_supported?: boolean;
    frontchannel_logout_supported?: boolean;
    frontchannel_logout_session_supported?: boolean;
};
export interface DiscoveryDocument {
    /**
     * Used to interact with the resource owner and obtain an authorization grant.
     *
     * [Section 3.1](https://tools.ietf.org/html/rfc6749#section-3.1)
     */
    authorizationEndpoint?: string;
    /**
     * Used by the client to obtain an access token by presenting its authorization grant or refresh token.
     * The token endpoint is used with every authorization grant except for the
     * implicit grant type (since an access token is issued directly).
     *
     * [Section 3.2](https://tools.ietf.org/html/rfc6749#section-3.2)
     */
    tokenEndpoint?: string;
    /**
     * Used to revoke a token (generally for signing out). The spec requires a revocation endpoint,
     * but some providers (like Spotify) do not support one.
     *
     * [Section 2.1](https://tools.ietf.org/html/rfc7009#section-2.1)
     */
    revocationEndpoint?: string;
    /**
     * URL of the OP's UserInfo Endpoint used to return info about the authenticated user.
     *
     * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
     */
    userInfoEndpoint?: string;
    /**
     * URL at the OP to which an RP can perform a redirect to request that the End-User be logged out at the OP.
     *
     * [OPMetadata](https://openid.net/specs/openid-connect-session-1_0-17.html#OPMetadata)
     */
    endSessionEndpoint?: string;
    /**
     * URL of the OP's [Dynamic Client Registration](https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Registration) Endpoint.
     */
    registrationEndpoint?: string;
    /**
     * All metadata about the provider.
     */
    discoveryDocument?: ProviderMetadata;
}
export declare type IssuerOrDiscovery = Issuer | DiscoveryDocument;
/**
 * Append the well known resources path and OpenID connect discovery document path to a URL
 * https://tools.ietf.org/html/rfc5785
 */
export declare function issuerWithWellKnownUrl(issuer: Issuer): string;
/**
 * Fetch a `DiscoveryDocument` from a well-known resource provider that supports auto discovery.
 * @param issuer An `Issuer` URL to fetch from.
 * @return Returns a discovery document that can be used for authentication.
 */
export declare function fetchDiscoveryAsync(issuer: Issuer): Promise<DiscoveryDocument>;
/**
 * Utility method for resolving the discovery document from an issuer or object.
 *
 * @param issuerOrDiscovery
 */
export declare function resolveDiscoveryAsync(issuerOrDiscovery: IssuerOrDiscovery): Promise<DiscoveryDocument>;
export {};
//# sourceMappingURL=Discovery.d.ts.map