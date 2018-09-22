/*! @file OIDTokenRequest.h
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

// This file only declares string constants useful for constructing a @c OIDTokenRequest, so it is
// imported here for convenience.
#import "OIDGrantTypes.h"

@class OIDAuthorizationResponse;
@class OIDServiceConfiguration;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents a token request.
    @see https://tools.ietf.org/html/rfc6749#section-3.2
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
@interface OIDTokenRequest : NSObject <NSCopying, NSSecureCoding> {
  // property variables
  OIDServiceConfiguration *_configuration;
  NSString *_grantType;
  NSString *_authorizationCode;
  NSURL *_redirectURL;
  NSString *_clientID;
  NSString *_clientSecret;
  NSString *_scope;
  NSString *_refreshToken;
  NSString *_codeVerifier;
  NSDictionary<NSString *, NSString *> *_additionalParameters;
}

/*! @brief The service's configuration.
    @remarks This configuration specifies how to connect to a particular OAuth provider.
        Configurations may be created manually, or via an OpenID Connect Discovery Document.
 */
@property(nonatomic, readonly) OIDServiceConfiguration *configuration;

/*! @brief The type of token being sent to the token endpoint, i.e. "authorization_code" for the
        authorization code exchange, or "refresh_token" for an access token refresh request.
    @remarks grant_type
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
    @see https://www.google.com/url?sa=D&q=https%3A%2F%2Ftools.ietf.org%2Fhtml%2Frfc6749%23section-6
 */
@property(nonatomic, readonly) NSString *grantType;

/*! @brief The authorization code received from the authorization server.
    @remarks code
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
@property(nonatomic, readonly, nullable) NSString *authorizationCode;

/*! @brief The client's redirect URI.
    @remarks redirect_uri
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
@property(nonatomic, readonly) NSURL *redirectURL;

/*! @brief The client identifier.
    @remarks client_id
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
@property(nonatomic, readonly) NSString *clientID;

/*! @brief The client secret.
    @remarks client_secret
    @see https://tools.ietf.org/html/rfc6749#section-2.3.1
 */
@property(nonatomic, readonly, nullable) NSString *clientSecret;

/*! @brief The value of the scope parameter is expressed as a list of space-delimited,
        case-sensitive strings.
    @remarks scope
    @see https://tools.ietf.org/html/rfc6749#section-3.3
 */
@property(nonatomic, readonly, nullable) NSString *scope;

/*! @brief The refresh token, which can be used to obtain new access tokens using the same
        authorization grant.
    @remarks refresh_token
    @see https://tools.ietf.org/html/rfc6749#section-5.1
 */
@property(nonatomic, readonly, nullable) NSString *refreshToken;

/*! @brief The PKCE code verifier used to redeem the authorization code.
    @remarks code_verifier
    @see https://tools.ietf.org/html/rfc7636#section-4.3
 */
@property(nonatomic, readonly, nullable) NSString *codeVerifier;

/*! @brief The client's additional token request parameters.
 */
@property(nonatomic, readonly, nullable) NSDictionary<NSString *, NSString *> *additionalParameters;

/*! @internal
    @brief Unavailable. Please use
        initWithConfiguration:grantType:code:redirectURL:clientID:additionalParameters:.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @param configuration The service's configuration.
    @param grantType the type of token being sent to the token endpoint, i.e. "authorization_code"
        for the authorization code exchange, or "refresh_token" for an access token refresh request.
        @see OIDGrantTypes.h
    @param code The authorization code received from the authorization server.
    @param redirectURL The client's redirect URI.
    @param clientID The client identifier.
    @param scopes An array of scopes to combine into a single scope string per the OAuth2 spec.
    @param refreshToken The refresh token.
    @param additionalParameters The client's additional token request parameters.
 */
- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               grantType:(NSString *)grantType
       authorizationCode:(nullable NSString *)code
             redirectURL:(NSURL *)redirectURL
                clientID:(NSString *)clientID
            clientSecret:(nullable NSString *)clientSecret
                  scopes:(nullable NSArray<NSString *> *)scopes
            refreshToken:(nullable NSString *)refreshToken
            codeVerifier:(nullable NSString *)codeVerifier
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters;

/*! @brief Designated initializer.
    @param configuration The service's configuration.
    @param grantType the type of token being sent to the token endpoint, i.e. "authorization_code"
        for the authorization code exchange, or "refresh_token" for an access token refresh request.
        @see OIDGrantTypes.h
    @param code The authorization code received from the authorization server.
    @param redirectURL The client's redirect URI.
    @param clientID The client identifier.
    @param scope The value of the scope parameter is expressed as a list of space-delimited,
        case-sensitive strings.
    @param refreshToken The refresh token.
    @param additionalParameters The client's additional token request parameters.
 */
- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               grantType:(NSString *)grantType
       authorizationCode:(nullable NSString *)code
             redirectURL:(NSURL *)redirectURL
                clientID:(NSString *)clientID
            clientSecret:(nullable NSString *)clientSecret
                   scope:(nullable NSString *)scope
            refreshToken:(nullable NSString *)refreshToken
            codeVerifier:(nullable NSString *)codeVerifier
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters
    NS_DESIGNATED_INITIALIZER;

/*! @brief Constructs an @c NSURLRequest representing the token request.
    @return An @c NSURLRequest representing the token request.
 */
- (NSURLRequest *)URLRequest;

@end

NS_ASSUME_NONNULL_END
