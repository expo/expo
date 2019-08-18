/*! @file OIDRegistrationResponse.m
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

#import "OIDRegistrationResponse.h"

#import "OIDClientMetadataParameters.h"
#import "OIDDefines.h"
#import "OIDFieldMapping.h"
#import "OIDRegistrationRequest.h"
#import "OIDTokenUtilities.h"

NSString *const OIDClientIDParam = @"client_id";
NSString *const OIDClientIDIssuedAtParam = @"client_id_issued_at";
NSString *const OIDClientSecretParam = @"client_secret";
NSString *const OIDClientSecretExpirestAtParam = @"client_secret_expires_at";
NSString *const OIDRegistrationAccessTokenParam = @"registration_access_token";
NSString *const OIDRegistrationClientURIParam = @"registration_client_uri";

/*! @brief Key used to encode the @c request property for @c NSSecureCoding
 */
static NSString *const kRequestKey = @"request";

/*! @brief Key used to encode the @c additionalParameters property for @c NSSecureCoding
 */
static NSString *const kAdditionalParametersKey = @"additionalParameters";

@implementation OIDRegistrationResponse

@synthesize request = _request;
@synthesize clientID = _clientID;
@synthesize clientIDIssuedAt = _clientIDIssuedAt;
@synthesize clientSecret = _clientSecret;
@synthesize clientSecretExpiresAt = _clientSecretExpiresAt;
@synthesize registrationAccessToken = _registrationAccessToken;
@synthesize registrationClientURI = _registrationClientURI;
@synthesize tokenEndpointAuthenticationMethod = _tokenEndpointAuthenticationMethod;
@synthesize additionalParameters = _additionalParameters;

/*! @brief Returns a mapping of incoming parameters to instance variables.
    @return A mapping of incoming parameters to instance variables.
 */
+ (NSDictionary<NSString *, OIDFieldMapping *> *)fieldMap {
  static NSMutableDictionary<NSString *, OIDFieldMapping *> *fieldMap;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    fieldMap = [NSMutableDictionary dictionary];
    fieldMap[OIDClientIDParam] = [[OIDFieldMapping alloc] initWithName:@"_clientID"
                                                                  type:[NSString class]];
    fieldMap[OIDClientIDIssuedAtParam] =
    [[OIDFieldMapping alloc] initWithName:@"_clientIDIssuedAt"
                                     type:[NSDate class]
                               conversion:[OIDFieldMapping dateEpochConversion]];
    fieldMap[OIDClientSecretParam] =
    [[OIDFieldMapping alloc] initWithName:@"_clientSecret"
                                     type:[NSString class]];
    fieldMap[OIDClientSecretExpirestAtParam] =
    [[OIDFieldMapping alloc] initWithName:@"_clientSecretExpiresAt"
                                     type:[NSDate class]
                               conversion:[OIDFieldMapping dateEpochConversion]];
    fieldMap[OIDRegistrationAccessTokenParam] =
    [[OIDFieldMapping alloc] initWithName:@"_registrationAccessToken"
                                     type:[NSString class]];
    fieldMap[OIDRegistrationClientURIParam] =
    [[OIDFieldMapping alloc] initWithName:@"_registrationClientURI"
                                     type:[NSURL class]
                               conversion:[OIDFieldMapping URLConversion]];
    fieldMap[OIDTokenEndpointAuthenticationMethodParam] =
    [[OIDFieldMapping alloc] initWithName:@"_tokenEndpointAuthenticationMethod"
                                     type:[NSString class]];
  });
  return fieldMap;
}


#pragma mark - Initializers

- (nonnull instancetype)init
  OID_UNAVAILABLE_USE_INITIALIZER(@selector(initWithRequest:parameters:))

- (instancetype)initWithRequest:(OIDRegistrationRequest *)request
                              parameters:(NSDictionary<NSString *, NSObject <NSCopying> *> *)parameters {
  self = [super init];
  if (self) {
    _request = [request copy];
    NSDictionary<NSString *, NSObject <NSCopying> *> *additionalParameters =
    [OIDFieldMapping remainingParametersWithMap:[[self class] fieldMap]
                                     parameters:parameters
                                       instance:self];
    _additionalParameters = additionalParameters;

    if ((_clientSecret && !_clientSecretExpiresAt)
        || (!!_registrationClientURI != !!_registrationAccessToken)) {
      // If client_secret is issued, client_secret_expires_at is REQUIRED,
      // and the response MUST contain "[...] both a Client Configuration Endpoint
      // and a Registration Access Token or neither of them"
      return nil;
    }
  }
  return self;
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
  OIDRegistrationRequest *request = [aDecoder decodeObjectOfClass:[OIDRegistrationRequest class]
                                                           forKey:kRequestKey];
  self = [self initWithRequest:request
                    parameters:@{}];
  if (self) {
    [OIDFieldMapping decodeWithCoder:aDecoder
                                 map:[[self class] fieldMap]
                            instance:self];
    _additionalParameters = [aDecoder decodeObjectOfClasses:[OIDFieldMapping JSONTypes]
                                                     forKey:kAdditionalParametersKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [OIDFieldMapping encodeWithCoder:aCoder map:[[self class] fieldMap] instance:self];
  [aCoder encodeObject:_request forKey:kRequestKey];
  [aCoder encodeObject:_additionalParameters forKey:kAdditionalParametersKey];
}

#pragma mark - NSObject overrides

- (NSString *)description {
  return [NSString stringWithFormat:@"<%@: %p, clientID: \"%@\", clientIDIssuedAt: %@, "
          "clientSecret: %@, clientSecretExpiresAt: \"%@\", "
          "registrationAccessToken: \"%@\", "
          "registrationClientURI: \"%@\", "
          "additionalParameters: %@, request: %@>",
          NSStringFromClass([self class]),
          (void *)self,
          _clientID,
          _clientIDIssuedAt,
          [OIDTokenUtilities redact:_clientSecret],
          _clientSecretExpiresAt,
          [OIDTokenUtilities redact:_registrationAccessToken],
          _registrationClientURI,
          _additionalParameters,
          _request];
}

@end
