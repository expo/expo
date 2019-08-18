/*! @file OIDAuthorizationService.h
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

@class OIDAuthorization;
@class OIDAuthorizationRequest;
@class OIDAuthorizationResponse;
@class OIDRegistrationRequest;
@class OIDRegistrationResponse;
@class OIDServiceConfiguration;
@class OIDTokenRequest;
@class OIDTokenResponse;
@protocol OIDAuthorizationFlowSession;
@protocol OIDExternalUserAgent;
@protocol OIDExternalUserAgentSession;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents the type of block used as a callback for creating a service configuration from
        a remote OpenID Connect Discovery document.
    @param configuration The service configuration, if available.
    @param error The error if an error occurred.
 */
typedef void (^OIDDiscoveryCallback)(OIDServiceConfiguration *_Nullable configuration,
                                     NSError *_Nullable error);

/*! @brief Represents the type of block used as a callback for various methods of
        @c OIDAuthorizationService.
    @param authorizationResponse The authorization response, if available.
    @param error The error if an error occurred.
 */
typedef void (^OIDAuthorizationCallback)(OIDAuthorizationResponse *_Nullable authorizationResponse,
                                         NSError *_Nullable error);

/*! @brief Represents the type of block used as a callback for various methods of
        @c OIDAuthorizationService.
    @param tokenResponse The token response, if available.
    @param error The error if an error occurred.
 */
typedef void (^OIDTokenCallback)(OIDTokenResponse *_Nullable tokenResponse,
                                 NSError *_Nullable error);

/*! @brief Represents the type of dictionary used to specify additional querystring parameters
        when making authorization or token endpoint requests.
 */
typedef NSDictionary<NSString *, NSString *> *_Nullable OIDTokenEndpointParameters;

/*! @brief Represents the type of block used as a callback for various methods of
        @c OIDAuthorizationService.
    @param registrationResponse The registration response, if available.
    @param error The error if an error occurred.
*/
typedef void (^OIDRegistrationCompletion)(OIDRegistrationResponse *_Nullable registrationResponse,
                                          NSError *_Nullable error);

/*! @brief Performs various OAuth and OpenID Connect related calls via the user agent or
        \NSURLSession.
 */
@interface OIDAuthorizationService : NSObject {
  // property variables
  OIDServiceConfiguration *_configuration;
}

/*! @brief The service's configuration.
    @remarks Each authorization service is initialized with a configuration. This configuration
        specifies how to connect to a particular OAuth provider. Clients should use separate
        authorization service instances for each provider they wish to integrate with.
        Configurations may be created manually, or via an OpenID Connect Discovery Document.
 */
@property(nonatomic, readonly) OIDServiceConfiguration *configuration;

/*! @internal
    @brief Unavailable. This class should not be initialized.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Convenience method for creating an authorization service configuration from an OpenID
        Connect compliant issuer URL.
    @param issuerURL The service provider's OpenID Connect issuer.
    @param completion A block which will be invoked when the authorization service configuration has
        been created, or when an error has occurred.
    @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
+ (void)discoverServiceConfigurationForIssuer:(NSURL *)issuerURL
                                   completion:(OIDDiscoveryCallback)completion;


/*! @brief Convenience method for creating an authorization service configuration from an OpenID
        Connect compliant identity provider's discovery document.
    @param discoveryURL The URL of the service provider's OpenID Connect discovery document.
    @param completion A block which will be invoked when the authorization service configuration has
        been created, or when an error has occurred.
    @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
+ (void)discoverServiceConfigurationForDiscoveryURL:(NSURL *)discoveryURL
                                         completion:(OIDDiscoveryCallback)completion;

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"

/*! @brief Perform an authorization flow using a generic flow shim.
    @param request The authorization request.
    @param externalUserAgent Generic external user-agent that can present an authorization
        request.
    @param callback The method called when the request has completed or failed.
    @return A @c OIDExternalUserAgentSession instance which will terminate when it
        receives a @c OIDExternalUserAgentSession.cancel message, or after processing a
        @c OIDExternalUserAgentSession.resumeExternalUserAgentFlowWithURL: message.
 */
+ (id<OIDExternalUserAgentSession, OIDAuthorizationFlowSession>)
    presentAuthorizationRequest:(OIDAuthorizationRequest *)request
              externalUserAgent:(id<OIDExternalUserAgent>)externalUserAgent
                       callback:(OIDAuthorizationCallback)callback;

#pragma GCC diagnostic pop

/*! @brief Performs a token request.
    @param request The token request.
    @param callback The method called when the request has completed or failed.
 */
+ (void)performTokenRequest:(OIDTokenRequest *)request callback:(OIDTokenCallback)callback;

/*! @brief Performs a token request.
    @param request The token request.
    @param authorizationResponse The original authorization response related to this token request.
    @param callback The method called when the request has completed or failed.
 */
+ (void)performTokenRequest:(OIDTokenRequest *)request
    originalAuthorizationResponse:(OIDAuthorizationResponse *_Nullable)authorizationResponse
                         callback:(OIDTokenCallback)callback;

/*! @brief Performs a registration request.
    @param request The registration request.
    @param completion The method called when the request has completed or failed.
 */
+ (void)performRegistrationRequest:(OIDRegistrationRequest *)request
                        completion:(OIDRegistrationCompletion)completion;

@end

NS_ASSUME_NONNULL_END
