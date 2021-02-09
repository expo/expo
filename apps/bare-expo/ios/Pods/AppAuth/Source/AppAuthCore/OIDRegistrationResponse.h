/*! @file OIDRegistrationResponse.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 The AppAuth for iOS Authors. All Rights Reserved.
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

@class OIDRegistrationRequest;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Parameter name for the client id.
 */
extern NSString *const OIDClientIDParam;

/*! @brief Parameter name for the client id issuance timestamp.
 */
extern NSString *const OIDClientIDIssuedAtParam;

/*! @brief Parameter name for the client secret.
 */
extern NSString *const OIDClientSecretParam;

/*! @brief Parameter name for the client secret expiration time.
 */
extern NSString *const OIDClientSecretExpirestAtParam;

/*! @brief Parameter name for the registration access token.
 */
extern NSString *const OIDRegistrationAccessTokenParam;

/*! @brief Parameter name for the client configuration URI.
 */
extern NSString *const OIDRegistrationClientURIParam;

/*! @brief Represents a registration response.
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@interface OIDRegistrationResponse : NSObject <NSCopying, NSSecureCoding>

/*! @brief The request which was serviced.
 */
@property(nonatomic, readonly) OIDRegistrationRequest *request;

/*! @brief The registered client identifier.
    @remarks client_id
    @see https://tools.ietf.org/html/rfc6749#section-4
    @see https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
@property(nonatomic, readonly) NSString *clientID;

/*! @brief Timestamp of when the client identifier was issued, if provided.
    @remarks client_id_issued_at
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@property(nonatomic, readonly, nullable) NSDate *clientIDIssuedAt;

/*! @brief TThe client secret, which is part of the client credentials, if provided.
    @remarks client_secret
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@property(nonatomic, readonly, nullable) NSString *clientSecret;

/*! @brief Timestamp of when the client credentials expires, if provided.
    @remarks client_secret_expires_at
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@property(nonatomic, readonly, nullable) NSDate *clientSecretExpiresAt;

/*! @brief Client registration access token that can be used for subsequent operations upon the
        client registration.
    @remarks registration_access_token
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@property(nonatomic, readonly, nullable) NSString *registrationAccessToken;

/*! @brief Location of the client configuration endpoint, if provided.
    @remarks registration_client_uri
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse
 */
@property(nonatomic, readonly, nullable) NSURL *registrationClientURI;

/*! @brief Client authentication method to use at the token endpoint, if provided.
    @remarks token_endpoint_auth_method
    @see http://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 */
@property(nonatomic, readonly, nullable) NSString *tokenEndpointAuthenticationMethod;

/*! @brief Additional parameters returned from the token server.
 */
@property(nonatomic, readonly, nullable) NSDictionary<NSString *, NSObject <NSCopying> *>
    *additionalParameters;

/*! @internal
    @brief Unavailable. Please use initWithRequest
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Designated initializer.
    @param request The serviced request.
    @param parameters The decoded parameters returned from the Authorization Server.
    @remarks Known parameters are extracted from the @c parameters parameter and the normative
        properties are populated. Non-normative parameters are placed in the
        @c #additionalParameters dictionary.
 */
- (instancetype)initWithRequest:(OIDRegistrationRequest *)request
                     parameters:(NSDictionary<NSString *, NSObject <NSCopying> *> *)parameters
                     NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
