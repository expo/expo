/*! @file OIDServiceConfiguration.h
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

@class OIDServiceConfiguration;
@class OIDServiceDiscovery;

NS_ASSUME_NONNULL_BEGIN

/*! @brief The type of block called when a @c OIDServiceConfiguration has been created
        by loading a @c OIDServiceDiscovery from an @c NSURL.
 */
typedef void (^OIDServiceConfigurationCreated)
    (OIDServiceConfiguration *_Nullable serviceConfiguration,
     NSError *_Nullable error);

/*! @brief Represents the information needed to construct a @c OIDAuthorizationService.
 */
@interface OIDServiceConfiguration : NSObject <NSCopying, NSSecureCoding> {
  // property variables
  NSURL *_authorizationEndpoint;
  NSURL *_tokenEndpoint;
  NSURL *_issuer;
  NSURL *_registrationEndpoint;
  OIDServiceDiscovery *_discoveryDocument;
}

/*! @brief The authorization endpoint URI.
 */
@property(nonatomic, readonly) NSURL *authorizationEndpoint;

/*! @brief The token exchange and refresh endpoint URI.
 */
@property(nonatomic, readonly) NSURL *tokenEndpoint;

/*! @brief The OpenID Connect issuer.
 */
@property(nonatomic, readonly, nullable) NSURL *issuer;

/*! @brief The dynamic client registration endpoint URI.
 */
@property(nonatomic, readonly, nullable) NSURL *registrationEndpoint;

/*! @brief The discovery document.
 */
@property(nonatomic, readonly, nullable) OIDServiceDiscovery *discoveryDocument;

/*! @internal
    @brief Unavailable. Please use @c initWithAuthorizationEndpoint:tokenEndpoint: or
        @c initWithDiscoveryDocument:.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @param authorizationEndpoint The authorization endpoint URI.
    @param tokenEndpoint The token exchange and refresh endpoint URI.
 */
- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint;

/*! @param authorizationEndpoint The authorization endpoint URI.
    @param tokenEndpoint The token exchange and refresh endpoint URI.
    @param registrationEndpoint The dynamic client registration endpoint URI.
 */
- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                         registrationEndpoint:(nullable NSURL *)registrationEndpoint;

/*! @param authorizationEndpoint The authorization endpoint URI.
    @param tokenEndpoint The token exchange and refresh endpoint URI.
    @param issuer The OpenID Connect issuer.
 */
- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                                       issuer:(nullable NSURL *)issuer;

/*! @param authorizationEndpoint The authorization endpoint URI.
    @param tokenEndpoint The token exchange and refresh endpoint URI.
    @param issuer The OpenID Connect issuer.
    @param registrationEndpoint The dynamic client registration endpoint URI.
 */
- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                                       issuer:(nullable NSURL *)issuer
                         registrationEndpoint:(nullable NSURL *)registrationEndpoint;

/*! @param discoveryDocument The discovery document from which to extract the required OAuth
        configuration.
 */
- (instancetype)initWithDiscoveryDocument:(OIDServiceDiscovery *)discoveryDocument;

@end

NS_ASSUME_NONNULL_END
