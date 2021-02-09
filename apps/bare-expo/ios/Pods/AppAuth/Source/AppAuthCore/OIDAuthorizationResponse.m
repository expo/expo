/*! @file OIDAuthorizationResponse.m
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

#import "OIDAuthorizationResponse.h"

#import "OIDAuthorizationRequest.h"
#import "OIDDefines.h"
#import "OIDError.h"
#import "OIDFieldMapping.h"
#import "OIDTokenRequest.h"
#import "OIDTokenUtilities.h"

/*! @brief The key for the @c authorizationCode property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kAuthorizationCodeKey = @"code";

/*! @brief The key for the @c state property in the incoming parameters and for @c NSSecureCoding.
 */
static NSString *const kStateKey = @"state";

/*! @brief The key for the @c accessToken property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kAccessTokenKey = @"access_token";

/*! @brief The key for the @c accessTokenExpirationDate property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kExpiresInKey = @"expires_in";

/*! @brief The key for the @c tokenType property in the incoming parameters and for
        @c NSSecureCoding.
 */
static NSString *const kTokenTypeKey = @"token_type";

/*! @brief The key for the @c idToken property in the incoming parameters and for @c NSSecureCoding.
 */
static NSString *const kIDTokenKey = @"id_token";

/*! @brief The key for the @c scope property in the incoming parameters and for @c NSSecureCoding.
 */
static NSString *const kScopeKey = @"scope";

/*! @brief Key used to encode the @c additionalParameters property for @c NSSecureCoding
 */
static NSString *const kAdditionalParametersKey = @"additionalParameters";

/*! @brief Key used to encode the @c request property for @c NSSecureCoding
 */
static NSString *const kRequestKey = @"request";

/*! @brief The exception thrown when a developer tries to create a token exchange request from an
        authorization request with no authorization code.
 */
static NSString *const kTokenExchangeRequestException =
    @"Attempted to create a token exchange request from an authorization response with no "
    "authorization code.";

@implementation OIDAuthorizationResponse

/*! @brief Returns a mapping of incoming parameters to instance variables.
    @return A mapping of incoming parameters to instance variables.
 */
+ (NSDictionary<NSString *, OIDFieldMapping *> *)fieldMap {
  static NSMutableDictionary<NSString *, OIDFieldMapping *> *fieldMap;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    fieldMap = [NSMutableDictionary dictionary];
    fieldMap[kStateKey] =
        [[OIDFieldMapping alloc] initWithName:@"_state" type:[NSString class]];
    fieldMap[kAuthorizationCodeKey] =
        [[OIDFieldMapping alloc] initWithName:@"_authorizationCode" type:[NSString class]];
    fieldMap[kAccessTokenKey] =
        [[OIDFieldMapping alloc] initWithName:@"_accessToken" type:[NSString class]];
    fieldMap[kExpiresInKey] =
        [[OIDFieldMapping alloc] initWithName:@"_accessTokenExpirationDate"
                                         type:[NSDate class]
                                   conversion:^id _Nullable(NSObject *_Nullable value) {
          if (![value isKindOfClass:[NSNumber class]]) {
            return value;
          }
          NSNumber *valueAsNumber = (NSNumber *)value;
          return [NSDate dateWithTimeIntervalSinceNow:[valueAsNumber longLongValue]];
        }];
    fieldMap[kTokenTypeKey] =
        [[OIDFieldMapping alloc] initWithName:@"_tokenType" type:[NSString class]];
    fieldMap[kIDTokenKey] =
        [[OIDFieldMapping alloc] initWithName:@"_idToken" type:[NSString class]];
    fieldMap[kScopeKey] =
        [[OIDFieldMapping alloc] initWithName:@"_scope" type:[NSString class]];
  });
  return fieldMap;
}

#pragma mark - Initializers

- (instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(@selector(initWithRequest:parameters:))

- (instancetype)initWithRequest:(OIDAuthorizationRequest *)request
    parameters:(NSDictionary<NSString *, NSObject<NSCopying> *> *)parameters {
  self = [super init];
  if (self) {
    _request = [request copy];
    NSDictionary<NSString *, NSObject<NSCopying> *> *additionalParameters =
        [OIDFieldMapping remainingParametersWithMap:[[self class] fieldMap]
                                         parameters:parameters
                                           instance:self];
    _additionalParameters = additionalParameters;
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

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  OIDAuthorizationRequest *request =
      [aDecoder decodeObjectOfClass:[OIDAuthorizationRequest class] forKey:kRequestKey];
  self = [self initWithRequest:request parameters:@{ }];
  if (self) {
    [OIDFieldMapping decodeWithCoder:aDecoder map:[[self class] fieldMap] instance:self];
    _additionalParameters = [aDecoder decodeObjectOfClasses:[OIDFieldMapping JSONTypes]
                                                     forKey:kAdditionalParametersKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_request forKey:kRequestKey];
  [OIDFieldMapping encodeWithCoder:aCoder map:[[self class] fieldMap] instance:self];
  [aCoder encodeObject:_additionalParameters forKey:kAdditionalParametersKey];
}

#pragma mark - NSObject overrides

- (NSString *)description {
  return [NSString stringWithFormat:@"<%@: %p, authorizationCode: %@, state: \"%@\", accessToken: "
                                     "\"%@\", accessTokenExpirationDate: %@, tokenType: %@, "
                                     "idToken: \"%@\", scope: \"%@\", additionalParameters: %@, "
                                     "request: %@>",
                                    NSStringFromClass([self class]),
                                    (void *)self,
                                    _authorizationCode,
                                    _state,
                                    [OIDTokenUtilities redact:_accessToken],
                                    _accessTokenExpirationDate,
                                    _tokenType,
                                    [OIDTokenUtilities redact:_idToken],
                                    _scope,
                                    _additionalParameters,
                                    _request];
}

#pragma mark -

- (OIDTokenRequest *)tokenExchangeRequest {
  return [self tokenExchangeRequestWithAdditionalParameters:nil];
}

- (OIDTokenRequest *)tokenExchangeRequestWithAdditionalParameters:
    (NSDictionary<NSString *, NSString *> *)additionalParameters {
  // TODO: add a unit test to confirm exception is thrown when expected and the request is created
  //       with the correct parameters.
  if (!_authorizationCode) {
    [NSException raise:kTokenExchangeRequestException
                format:kTokenExchangeRequestException];
  }
  return [[OIDTokenRequest alloc] initWithConfiguration:_request.configuration
                                              grantType:OIDGrantTypeAuthorizationCode
                                      authorizationCode:_authorizationCode
                                            redirectURL:_request.redirectURL
                                               clientID:_request.clientID
                                           clientSecret:_request.clientSecret
                                                  scope:nil
                                           refreshToken:nil
                                           codeVerifier:_request.codeVerifier
                                   additionalParameters:additionalParameters];
}

@end
