/*! @file OIDRegistrationRequest.h
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

@class OIDAuthorizationResponse;
@class OIDServiceConfiguration;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents a registration request.
    @see https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationRequest
 */
@interface OIDRegistrationRequest : NSObject <NSCopying, NSSecureCoding> {
  // property variables
  OIDServiceConfiguration *_configuration;
  NSString *_applicationType;
  NSArray<NSURL *> *_redirectURIs;
  NSArray<NSString *> *_responseTypes;
  NSArray<NSString *> *_grantTypes;
  NSString *_subjectType;
  NSString *_tokenEndpointAuthenticationMethod;
  NSDictionary<NSString *, NSString *> *_additionalParameters;
}

/*! @brief The service's configuration.
    @remarks This configuration specifies how to connect to a particular OAuth provider.
        Configurations may be created manually, or via an OpenID Connect Discovery Document.
 */
@property(nonatomic, readonly) OIDServiceConfiguration *configuration;

/*! @brief The application type to register, will always be 'native'.
    @remarks application_type
    @see https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
 */
@property(nonatomic, readonly) NSString *applicationType;

/*! @brief The client's redirect URI's.
    @remarks redirect_uris
    @see https://tools.ietf.org/html/rfc6749#section-3.1.2
 */
@property(nonatomic, readonly) NSArray<NSURL *> *redirectURIs;

/*! @brief The response types to register for usage by this client.
    @remarks response_types
    @see http://openid.net/specs/openid-connect-core-1_0.html#Authentication
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *responseTypes;

/*! @brief The grant types to register for usage by this client.
    @remarks grant_types
 @see https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
 */
@property(nonatomic, readonly, nullable) NSArray<NSString *> *grantTypes;

/*! @brief The subject type to to request.
    @remarks subject_type
    @see http://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes
 */
@property(nonatomic, readonly, nullable) NSString *subjectType;

/*! @brief The client authentication method to use at the token endpoint.
    @remarks token_endpoint_auth_method
    @see http://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 */
@property(nonatomic, readonly, nullable) NSString *tokenEndpointAuthenticationMethod;

/*! @brief The client's additional token request parameters.
 */
@property(nonatomic, readonly, nullable) NSDictionary<NSString *, NSString *> *additionalParameters;

/*! @internal
    @brief Unavailable. Please use initWithConfiguration
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Designated initializer.
    @param configuration The service's configuration.
    @param redirectURIs The redirect URIs to register for the client.
    @param responseTypes The response types to register for the client.
    @param grantTypes The grant types to register for the client.
    @param subjectType The subject type to register for the client.
    @param tokenEndpointAuthMethod The token endpoint authentication method to register for the
        client.
    @param additionalParameters The client's additional registration request parameters.
 */
- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               redirectURIs:(NSArray<NSURL *> *)redirectURIs
              responseTypes:(nullable NSArray<NSString *> *)responseTypes
                 grantTypes:(nullable NSArray<NSString *> *)grantTypes
                subjectType:(nullable NSString *)subjectType
    tokenEndpointAuthMethod:(nullable NSString *)tokenEndpointAuthMethod
       additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters
    NS_DESIGNATED_INITIALIZER;

/*! @brief Constructs an @c NSURLRequest representing the registration request.
    @return An @c NSURLRequest representing the registration request.
 */
- (NSURLRequest *)URLRequest;

@end

NS_ASSUME_NONNULL_END
