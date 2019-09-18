/*! @file OIDServiceDiscovery.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents an OpenID Connect 1.0 Discovery Document
    @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
 */
@interface OIDServiceDiscovery : NSObject <NSCopying, NSSecureCoding>

/*! @brief The decoded OpenID Connect 1.0 Discovery Document as a dictionary.
 */
@property(nonatomic, readonly) NSDictionary<NSString *, id> *discoveryDictionary;

/*! @brief REQUIRED. URL using the @c https scheme with no query or fragment component that the OP
        asserts as its Issuer Identifier. If Issuer discovery is supported, this value MUST be
        identical to the issuer value returned by WebFinger. This also MUST be identical to the
        @c iss Claim value in ID Tokens issued from this Issuer.
    @remarks issuer
    @seealso https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery
 */
@property(nonatomic, readonly) NSURL *issuer;

/*! @brief REQUIRED. URL of the OP's OAuth 2.0 Authorization Endpoint.
    @remarks authorization_endpoint
    @seealso http://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 */
@property(nonatomic, readonly) NSURL *authorizationEndpoint;

/*! @brief URL of the OP's OAuth 2.0 Token Endpoint. This is REQUIRED unless only the Implicit Flow
        is used.
    @remarks token_endpoint
    @seealso http://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint
 */
@property(nonatomic, readonly) NSURL *tokenEndpoint;

/*! @brief RECOMMENDED. URL of the OP's UserInfo Endpoint. This URL MUST use the https scheme and
        MAY contain port, path, and query parameter components.
    @remarks userinfo_endpoint
    @seealso http://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 */
@property(nonatomic, readonly, nullable) NSURL *userinfoEndpoint;

/*! @brief REQUIRED. URL of the OP's JSON Web Key Set document. This contains the signing key(s) the
        RP uses to validate signatures from the OP. The JWK Set MAY also contain the Server's
        encryption key(s), which are used by RPs to encrypt requests to the Server. When both
        signing and encryption keys are made available, a use (Key Use) parameter value is REQUIRED
        for all keys in the referenced JWK Set to indicate each key's intended usage. Although some
        algorithms allow the same key to be used for both signatures and encryption, doing so is NOT
        RECOMMENDED, as it is less secure. The JWK x5c parameter MAY be used to provide X.509
        representations of keys provided. When used, the bare key values MUST still be present and
        MUST match those in the certificate.
    @remarks jwks_uri
    @seealso http://tools.ietf.org/html/rfc7517
 */
@property(nonatomic, readonly) NSURL *jwksURL;

/*! @brief RECOMMENDED. URL of the OP's Dynamic Client Registration Endpoint.
    @remarks registration_endpoint
    @seealso http://openid.net/specs/openid-connect-registration-1_0.html
 */
@property(nonatomic, readonly, nullable) NSURL *registrationEndpoint;

/* @brief OPTIONAL. URL of the OP's RP-Initiated Logout endpoint.
   @remarks end_session_endpoint
   @seealso http://openid.net/specs/openid-connect-session-1_0.html#OPMetadata
 */
@property(nonatomic, readonly, nullable) NSURL *endSessionEndpoint;

/*! @brief RECOMMENDED. JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that
        this server supports. The server MUST support the openid scope value. Servers MAY choose not
        to advertise some supported scope values even when this parameter is used, although those
        defined in [OpenID.Core] SHOULD be listed, if supported.
    @remarks scopes_supported
    @seealso http://tools.ietf.org/html/rfc6749#section-3.3
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *scopesSupported;

/*! @brief REQUIRED. JSON array containing a list of the OAuth 2.0 @c response_type values that this
        OP supports. Dynamic OpenID Providers MUST support the @c code, @c id_token, and the token
        @c id_token Response Type values.
    @remarks response_types_supported
 */
@property(nonatomic, readonly) NSArray<NSString *> *responseTypesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the OAuth 2.0 @c response_mode values that this
        OP supports, as specified in OAuth 2.0 Multiple Response Type Encoding Practices. If
        omitted, the default for Dynamic OpenID Providers is @c ["query", "fragment"].
    @remarks response_modes_supported
    @seealso http://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *responseModesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the OAuth 2.0 Grant Type values that this OP
        supports. Dynamic OpenID Providers MUST support the @c authorization_code and @c implicit
        Grant Type values and MAY support other Grant Types. If omitted, the default value is
        @c ["authorization_code", "implicit"].
    @remarks grant_types_supported
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *grantTypesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the Authentication Context Class References
        that this OP supports.
    @remarks acr_values_supported
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *acrValuesSupported;

/*! @brief REQUIRED. JSON array containing a list of the Subject Identifier types that this OP
        supports. Valid types include @c pairwise and @c public.
    @remarks subject_types_supported
 */
@property(nonatomic, readonly) NSArray<NSString *> *subjectTypesSupported;

/*! @brief REQUIRED. JSON array containing a list of the JWS signing algorithms (@c alg values)
        supported by the OP for the ID Token to encode the Claims in a JWT. The algorithm @c RS256
        MUST be included. The value @c none MAY be supported, but MUST NOT be used unless the
        Response Type used returns no ID Token from the Authorization Endpoint (such as when using
        the Authorization Code Flow).
    @remarks id_token_signing_alg_values_supported
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly) NSArray<NSString *> *IDTokenSigningAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (@c alg values)
        supported by the OP for the ID Token to encode the Claims in a JWT.
    @remarks id_token_encryption_alg_values_supported
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *IDTokenEncryptionAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (@c enc values)
        supported by the OP for the ID Token to encode the Claims in a JWT.
    @remarks id_token_encryption_enc_values_supported
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *IDTokenEncryptionEncodingValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWS signing algorithms (@c alg values)
        supported by the UserInfo Endpoint to encode the Claims in a JWT. The value none MAY be
        included.
    @remarks userinfo_signing_alg_values_supported
    @seealso https://tools.ietf.org/html/rfc7515
    @seealso https://tools.ietf.org/html/rfc7518
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *userinfoSigningAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (alg values)
        supported by the UserInfo Endpoint to encode the Claims in a JWT.
    @remarks userinfo_encryption_alg_values_supported
    @seealso https://tools.ietf.org/html/rfc7516
    @seealso https://tools.ietf.org/html/rfc7518
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *userinfoEncryptionAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (@c enc values)
        supported by the UserInfo Endpoint to encode the Claims in a JWT.
    @remarks userinfo_encryption_enc_values_supported
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *userinfoEncryptionEncodingValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWS signing algorithms (@c alg values)
        supported by the OP for Request Objects, which are described in Section 6.1 of OpenID
        Connect Core 1.0. These algorithms are used both when the Request Object is passed by value
        (using the request parameter) and when it is passed by reference (using the @c request_uri
        parameter). Servers SHOULD support @c none and @c RS256.
    @remarks request_object_signing_alg_values_supported
    @seealso http://openid.net/specs/openid-connect-core-1_0.html
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *requestObjectSigningAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (@c alg values)
        supported by the OP for Request Objects. These algorithms are used both when the Request
        Object is passed by value and when it is passed by reference.
    @remarks request_object_encryption_alg_values_supported
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *requestObjectEncryptionAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWE encryption algorithms (@c enc values)
        supported by the OP for Request Objects. These algorithms are used both when the Request
        Object is passed by value and when it is passed by reference.
    @remarks request_object_encryption_enc_values_supported
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *requestObjectEncryptionEncodingValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of Client Authentication methods supported by this
        Token Endpoint. The options are @c client_secret_post, @c client_secret_basic,
        @c client_secret_jwt, and @c private_key_jwt, as described in Section 9 of OpenID Connect
        Core 1.0. Other authentication methods MAY be defined by extensions. If omitted, the default
        is @c client_secret_basic -- the HTTP Basic Authentication Scheme specified in Section 2.3.1
        of OAuth 2.0.
    @remarks token_endpoint_auth_methods_supported
    @seealso http://openid.net/specs/openid-connect-core-1_0.html
    @seealso http://tools.ietf.org/html/rfc6749#section-2.3.1
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *tokenEndpointAuthMethodsSupported;

/*! @brief OPTIONAL. JSON array containing a list of the JWS signing algorithms (@c alg values)
        supported by the Token Endpoint for the signature on the JWT used to authenticate the Client
        at the Token Endpoint for the @c private_key_jwt and @c client_secret_jwt authentication
        methods. Servers SHOULD support @c RS256. The value @c none MUST NOT be used.
    @remarks token_endpoint_auth_signing_alg_values_supported
    @seealso https://tools.ietf.org/html/rfc7519
 */
@property(nonatomic, readonly, nullable)
    NSArray<NSString *> *tokenEndpointAuthSigningAlgorithmValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the @c display parameter values that the OpenID
        Provider supports. These values are described in Section 3.1.2.1 of OpenID Connect Core 1.0.
    @remarks display_values_supported
    @seealso http://openid.net/specs/openid-connect-core-1_0.html
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *displayValuesSupported;

/*! @brief OPTIONAL. JSON array containing a list of the Claim Types that the OpenID Provider
        supports. These Claim Types are described in Section 5.6 of OpenID Connect Core 1.0. Values
        defined by this specification are @c normal, @c aggregated, and @c distributed. If omitted,
        the implementation supports only @c normal Claims.
    @remarks claim_types_supported
    @seealso http://openid.net/specs/openid-connect-core-1_0.html
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *claimTypesSupported;

/*! @brief RECOMMENDED. JSON array containing a list of the Claim Names of the Claims that the
        OpenID Provider MAY be able to supply values for. Note that for privacy or other reasons,
        this might not be an exhaustive list.
    @remarks claims_supported
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *claimsSupported;

/*! @brief OPTIONAL. URL of a page containing human-readable information that developers might want
        or need to know when using the OpenID Provider. In particular, if the OpenID Provider does
        not support Dynamic Client Registration, then information on how to register Clients needs
        to be provided in this documentation.
    @remarks service_documentation
 */
@property(nonatomic, readonly, nullable) NSURL *serviceDocumentation;

/*! @brief OPTIONAL. Languages and scripts supported for values in Claims being returned,
        represented as a JSON array of BCP47 language tag values. Not all languages and scripts are
        necessarily supported for all Claim values.
    @remarks claims_locales_supported
    @seealso http://tools.ietf.org/html/rfc5646
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *claimsLocalesSupported;

/*! @brief OPTIONAL. Languages and scripts supported for the user interface, represented as a JSON
        array of BCP47 language tag values.
    @remarks ui_locales_supported
    @seealso http://tools.ietf.org/html/rfc5646
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *UILocalesSupported;

/*! @brief OPTIONAL. Boolean value specifying whether the OP supports use of the claims parameter,
        with @c true indicating support. If omitted, the default value is @c false.
    @remarks claims_parameter_supported
 */
@property(nonatomic, readonly) BOOL claimsParameterSupported;

/*! @brief OPTIONAL. Boolean value specifying whether the OP supports use of the request parameter,
        with @c true indicating support. If omitted, the default value is @c false.
    @remarks request_parameter_supported
 */
@property(nonatomic, readonly) BOOL requestParameterSupported;

/*! @brief OPTIONAL. Boolean value specifying whether the OP supports use of the @c request_uri
        parameter, with true indicating support. If omitted, the default value is @c true.
    @remarks request_uri_parameter_supported
 */
@property(nonatomic, readonly) BOOL requestURIParameterSupported;

/*! @brief OPTIONAL. Boolean value specifying whether the OP requires any @c request_uri values used
        to be pre-registered using the @c request_uris registration parameter. Pre-registration is
        REQUIRED when the value is @c true. If omitted, the default value is @c false.
    @remarks require_request_uri_registration
 */
@property(nonatomic, readonly) BOOL requireRequestURIRegistration;

/*! @brief OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to
        read about the OP's requirements on how the Relying Party can use the data provided by the
        OP. The registration process SHOULD display this URL to the person registering the Client if
        it is given.
    @remarks op_policy_uri
 */
@property(nonatomic, readonly, nullable) NSURL *OPPolicyURI;

/*! @brief OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to
        read about OpenID Provider's terms of service. The registration process SHOULD display this
        URL to the person registering the Client if it is given.
    @remarks op_tos_uri
 */
@property(nonatomic, readonly, nullable) NSURL *OPTosURI;

/*! @internal
    @brief Unavailable. Please use @c initWithDictionary:error:, @c initWithJSON:error, or the
        @c serviceDiscoveryWithURL:callback: factory method.
 */
- (nonnull instancetype)init NS_UNAVAILABLE;

/*! @brief Decodes a OpenID Connect Discovery 1.0 JSON document.
    @param serviceDiscoveryJSON An OpenID Connect Service Discovery document.
    @param error If a required field is missing from the dictionary, an error with domain
        @c ::OIDGeneralErrorDomain and code @c ::OIDErrorCodeInvalidDiscoveryDocument will be
        returned.
 */
- (nullable instancetype)initWithJSON:(NSString *)serviceDiscoveryJSON
                                error:(NSError **_Nullable)error;

/*! @brief Decodes a OpenID Connect Discovery 1.0 JSON document.
    @param serviceDiscoveryJSONData An OpenID Connect Service Discovery document.
    @param error If a required field is missing from the dictionary, an error with domain
        @c ::OIDGeneralErrorDomain and code @c ::OIDErrorCodeInvalidDiscoveryDocument will be
        returned.
 */
- (nullable instancetype)initWithJSONData:(NSData *)serviceDiscoveryJSONData
                                    error:(NSError **_Nullable)error;

/*! @brief Designated initializer. The dictionary keys should match the keys defined in the OpenID
        Connect Discovery 1.0 standard for OpenID Provider Metadata.
    @param serviceDiscoveryDictionary A dictionary representing an OpenID Connect Service Discovery
        document.
    @param error If a required field is missing from the dictionary, an error with domain
        @c ::OIDGeneralErrorDomain and code @c ::OIDErrorCodeInvalidDiscoveryDocument will be
        returned.
 */
- (nullable instancetype)initWithDictionary:(NSDictionary *)serviceDiscoveryDictionary
                                      error:(NSError **_Nullable)error NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
