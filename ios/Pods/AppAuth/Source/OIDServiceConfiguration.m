/*! @file OIDServiceConfiguration.m
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

#import "OIDServiceConfiguration.h"

#import "OIDDefines.h"
#import "OIDErrorUtilities.h"
#import "OIDServiceDiscovery.h"

/*! @brief The key for the @c authorizationEndpoint property.
 */
static NSString *const kAuthorizationEndpointKey = @"authorizationEndpoint";

/*! @brief The key for the @c tokenEndpoint property.
 */
static NSString *const kTokenEndpointKey = @"tokenEndpoint";

/*! @brief The key for the @c issuer property.
 */
static NSString *const kIssuerKey = @"issuer";

/*! @brief The key for the @c registrationEndpoint property.
 */
static NSString *const kRegistrationEndpointKey = @"registrationEndpoint";

/*! @brief The key for the @c discoveryDocument property.
 */
static NSString *const kDiscoveryDocumentKey = @"discoveryDocument";

NS_ASSUME_NONNULL_BEGIN

@interface OIDServiceConfiguration ()

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                                       issuer:(nullable NSURL *)issuer
                         registrationEndpoint:(nullable NSURL *)registrationEndpoint
                            discoveryDocument:(nullable OIDServiceDiscovery *)discoveryDocument
                            NS_DESIGNATED_INITIALIZER;

@end

@implementation OIDServiceConfiguration

@synthesize authorizationEndpoint = _authorizationEndpoint;
@synthesize tokenEndpoint = _tokenEndpoint;
@synthesize issuer = _issuer;
@synthesize registrationEndpoint = _registrationEndpoint;
@synthesize discoveryDocument = _discoveryDocument;

- (instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(@selector(
        initWithAuthorizationEndpoint:
                        tokenEndpoint:)
    )

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
        tokenEndpoint:(NSURL *)tokenEndpoint
               issuer:(nullable NSURL *)issuer
 registrationEndpoint:(nullable NSURL *)registrationEndpoint
    discoveryDocument:(nullable OIDServiceDiscovery *)discoveryDocument {

  self = [super init];
  if (self) {
    _authorizationEndpoint = [authorizationEndpoint copy];
    _tokenEndpoint = [tokenEndpoint copy];
    _issuer = [issuer copy];
    _registrationEndpoint = [registrationEndpoint copy];
    _discoveryDocument = [discoveryDocument copy];
  }
  return self;
}

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint {
  return [self initWithAuthorizationEndpoint:authorizationEndpoint
                               tokenEndpoint:tokenEndpoint
                                      issuer:nil
                        registrationEndpoint:nil
                           discoveryDocument:nil];
}

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                         registrationEndpoint:(nullable NSURL *)registrationEndpoint {
  return [self initWithAuthorizationEndpoint:authorizationEndpoint
                               tokenEndpoint:tokenEndpoint
                                      issuer:nil
                        registrationEndpoint:registrationEndpoint
                           discoveryDocument:nil];
}

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                                       issuer:(nullable NSURL *)issuer {
  return [self initWithAuthorizationEndpoint:authorizationEndpoint
                               tokenEndpoint:tokenEndpoint
                                      issuer:issuer
                        registrationEndpoint:nil
                           discoveryDocument:nil];
}

- (instancetype)initWithAuthorizationEndpoint:(NSURL *)authorizationEndpoint
                                tokenEndpoint:(NSURL *)tokenEndpoint
                                       issuer:(nullable NSURL *)issuer
                         registrationEndpoint:(nullable NSURL *)registrationEndpoint {
  return [self initWithAuthorizationEndpoint:authorizationEndpoint
                               tokenEndpoint:tokenEndpoint
                                      issuer:issuer
                        registrationEndpoint:registrationEndpoint
                           discoveryDocument:nil];
}

- (instancetype)initWithDiscoveryDocument:(OIDServiceDiscovery *) discoveryDocument {
  return [self initWithAuthorizationEndpoint:discoveryDocument.authorizationEndpoint
                               tokenEndpoint:discoveryDocument.tokenEndpoint
                                      issuer:discoveryDocument.issuer
                        registrationEndpoint:discoveryDocument.registrationEndpoint
                           discoveryDocument:discoveryDocument];
}

#pragma mark - NSCopying

- (instancetype)copyWithZone:(nullable NSZone *)zone {
  // The documentation for NSCopying specifically advises us to return a reference to the original
  // instance in the case where instances are immutable (as ours is):
  // "Implement NSCopying by retaining the original instead of creating a new copy when the class
  // and its contents are immutable."
  return self;
}

#pragma mark - NSSecureCoding

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (nullable instancetype)initWithCoder:(NSCoder *)aDecoder {
  NSURL *authorizationEndpoint = [aDecoder decodeObjectOfClass:[NSURL class]
                                                        forKey:kAuthorizationEndpointKey];
  NSURL *tokenEndpoint = [aDecoder decodeObjectOfClass:[NSURL class]
                                                forKey:kTokenEndpointKey];
  NSURL *issuer = [aDecoder decodeObjectOfClass:[NSURL class]
                                         forKey:kIssuerKey];
  NSURL *registrationEndpoint = [aDecoder decodeObjectOfClass:[NSURL class]
                                                       forKey:kRegistrationEndpointKey];
  // We don't accept nil authorizationEndpoints or tokenEndpoints.
  if (!authorizationEndpoint || !tokenEndpoint) {
    return nil;
  }

  OIDServiceDiscovery *discoveryDocument = [aDecoder decodeObjectOfClass:[OIDServiceDiscovery class]
                                                                  forKey:kDiscoveryDocumentKey];

  return [self initWithAuthorizationEndpoint:authorizationEndpoint
                               tokenEndpoint:tokenEndpoint
                                      issuer:issuer
                        registrationEndpoint:registrationEndpoint
                           discoveryDocument:discoveryDocument];
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_authorizationEndpoint forKey:kAuthorizationEndpointKey];
  [aCoder encodeObject:_tokenEndpoint forKey:kTokenEndpointKey];
  [aCoder encodeObject:_issuer forKey:kIssuerKey];
  [aCoder encodeObject:_registrationEndpoint forKey:kRegistrationEndpointKey];
  [aCoder encodeObject:_discoveryDocument forKey:kDiscoveryDocumentKey];
}

#pragma mark - description

- (NSString *)description {
  return [NSString stringWithFormat:
      @"OIDServiceConfiguration authorizationEndpoint: %@, tokenEndpoint: %@, "
          "registrationEndpoint: %@, discoveryDocument: [%@]",
      _authorizationEndpoint,
      _tokenEndpoint,
      _registrationEndpoint,
      _discoveryDocument];
}

@end

NS_ASSUME_NONNULL_END
