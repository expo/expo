/*! @file OIDServiceDiscovery.m
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

#import "OIDServiceDiscovery.h"

#import "OIDDefines.h"
#import "OIDErrorUtilities.h"

NS_ASSUME_NONNULL_BEGIN

/*! Field keys associated with an OpenID Connect Discovery Document. */
static NSString *const kIssuerKey = @"issuer";
static NSString *const kAuthorizationEndpointKey = @"authorization_endpoint";
static NSString *const kTokenEndpointKey = @"token_endpoint";
static NSString *const kUserinfoEndpointKey = @"userinfo_endpoint";
static NSString *const kJWKSURLKey = @"jwks_uri";
static NSString *const kRegistrationEndpointKey = @"registration_endpoint";
static NSString *const kEndSessionEndpointKey = @"end_session_endpoint";
static NSString *const kScopesSupportedKey = @"scopes_supported";
static NSString *const kResponseTypesSupportedKey = @"response_types_supported";
static NSString *const kResponseModesSupportedKey = @"response_modes_supported";
static NSString *const kGrantTypesSupportedKey = @"grant_types_supported";
static NSString *const kACRValuesSupportedKey = @"acr_values_supported";
static NSString *const kSubjectTypesSupportedKey = @"subject_types_supported";
static NSString *const kIDTokenSigningAlgorithmValuesSupportedKey =
    @"id_token_signing_alg_values_supported";
static NSString *const kIDTokenEncryptionAlgorithmValuesSupportedKey =
    @"id_token_encryption_alg_values_supported";
static NSString *const kIDTokenEncryptionEncodingValuesSupportedKey =
    @"id_token_encryption_enc_values_supported";
static NSString *const kUserinfoSigningAlgorithmValuesSupportedKey =
    @"userinfo_signing_alg_values_supported";
static NSString *const kUserinfoEncryptionAlgorithmValuesSupportedKey =
    @"userinfo_encryption_alg_values_supported";
static NSString *const kUserinfoEncryptionEncodingValuesSupportedKey =
    @"userinfo_encryption_enc_values_supported";
static NSString *const kRequestObjectSigningAlgorithmValuesSupportedKey =
    @"request_object_signing_alg_values_supported";
static NSString *const kRequestObjectEncryptionAlgorithmValuesSupportedKey =
    @"request_object_encryption_alg_values_supported";
static NSString *const kRequestObjectEncryptionEncodingValuesSupported =
    @"request_object_encryption_enc_values_supported";
static NSString *const kTokenEndpointAuthMethodsSupportedKey =
    @"token_endpoint_auth_methods_supported";
static NSString *const kTokenEndpointAuthSigningAlgorithmValuesSupportedKey =
    @"token_endpoint_auth_signing_alg_values_supported";
static NSString *const kDisplayValuesSupportedKey = @"display_values_supported";
static NSString *const kClaimTypesSupportedKey = @"claim_types_supported";
static NSString *const kClaimsSupportedKey = @"claims_supported";
static NSString *const kServiceDocumentationKey = @"service_documentation";
static NSString *const kClaimsLocalesSupportedKey = @"claims_locales_supported";
static NSString *const kUILocalesSupportedKey = @"ui_locales_supported";
static NSString *const kClaimsParameterSupportedKey = @"claims_parameter_supported";
static NSString *const kRequestParameterSupportedKey = @"request_parameter_supported";
static NSString *const kRequestURIParameterSupportedKey = @"request_uri_parameter_supported";
static NSString *const kRequireRequestURIRegistrationKey = @"require_request_uri_registration";
static NSString *const kOPPolicyURIKey = @"op_policy_uri";
static NSString *const kOPTosURIKey = @"op_tos_uri";

@implementation OIDServiceDiscovery {
  NSDictionary *_discoveryDictionary;
}

- (nonnull instancetype)init OID_UNAVAILABLE_USE_INITIALIZER(@selector(initWithDictionary:error:))

- (nullable instancetype)initWithJSON:(NSString *)serviceDiscoveryJSON error:(NSError **)error {
  NSData *jsonData = [serviceDiscoveryJSON dataUsingEncoding:NSUTF8StringEncoding];
  return [self initWithJSONData:jsonData error:error];
}

- (nullable instancetype)initWithJSONData:(NSData *)serviceDiscoveryJSONData
                                    error:(NSError **_Nullable)error {
  NSError *jsonError;
  NSDictionary *json =
      [NSJSONSerialization JSONObjectWithData:serviceDiscoveryJSONData options:0 error:&jsonError];
  if (!json || jsonError) {
    *error = [OIDErrorUtilities errorWithCode:OIDErrorCodeJSONDeserializationError
                              underlyingError:jsonError
                                  description:jsonError.localizedDescription];
    return nil;
  }
  if (![json isKindOfClass:[NSDictionary class]]) {
    *error = [OIDErrorUtilities errorWithCode:OIDErrorCodeInvalidDiscoveryDocument
                              underlyingError:nil
                                  description:@"Discovery document isn't a dictionary"];
    return nil;
  }

  return [self initWithDictionary:json error:error];
}

- (nullable instancetype)initWithDictionary:(NSDictionary *)serviceDiscoveryDictionary
                                      error:(NSError **_Nullable)error {
  if (![[self class] dictionaryHasRequiredFields:serviceDiscoveryDictionary error:error]) {
    return nil;
  }
  self = [super init];
  if (self) {
    _discoveryDictionary = [serviceDiscoveryDictionary copy];
  }
  return self;
}

#pragma mark -

/*! @brief Checks to see if the specified dictionary contains the required fields.
    @discussion This test is not meant to provide semantic analysis of the document (eg. fields
        where the value @c none is not an allowed option would not cause this method to fail if
        their value was @c none.) We are just testing to make sure we can meet the nullability
        contract we promised in the header.
 */
+ (BOOL)dictionaryHasRequiredFields:(NSDictionary<NSString *, id> *)dictionary
                              error:(NSError **_Nullable)error {
  static NSString *const kMissingFieldErrorText = @"Missing field: %@";
  static NSString *const kInvalidURLFieldErrorText = @"Invalid URL: %@";

  NSArray *requiredFields = @[
    kIssuerKey,
    kAuthorizationEndpointKey,
    kTokenEndpointKey,
    kJWKSURLKey,
    kResponseTypesSupportedKey,
    kSubjectTypesSupportedKey,
    kIDTokenSigningAlgorithmValuesSupportedKey
  ];

  for (NSString *field in requiredFields) {
    if (!dictionary[field]) {
      if (error) {
        NSString *errorText = [NSString stringWithFormat:kMissingFieldErrorText, field];
        *error = [OIDErrorUtilities errorWithCode:OIDErrorCodeInvalidDiscoveryDocument
                                  underlyingError:nil
                                      description:errorText];
      }
      return NO;
    }
  }

  // Check required URL fields are valid URLs.
  NSArray *requiredURLFields = @[
    kIssuerKey,
    kTokenEndpointKey,
    kJWKSURLKey
  ];

  for (NSString *field in requiredURLFields) {
    if (![NSURL URLWithString:dictionary[field]]) {
      if (error) {
        NSString *errorText = [NSString stringWithFormat:kInvalidURLFieldErrorText, field];
        *error = [OIDErrorUtilities errorWithCode:OIDErrorCodeInvalidDiscoveryDocument
                                  underlyingError:nil
                                      description:errorText];
      }
      return NO;
    }
  }

  return YES;
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
  NSError *error;
  NSDictionary *dictionary = [[NSDictionary alloc] initWithCoder:aDecoder];
  self = [self initWithDictionary:dictionary error:&error];
  if (error) {
    return nil;
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [_discoveryDictionary encodeWithCoder:aCoder];
}

#pragma mark - Properties

- (NSDictionary<NSString *, NSString *> *)discoveryDictionary {
  return _discoveryDictionary;
}

- (NSURL *)issuer {
  return [NSURL URLWithString:_discoveryDictionary[kIssuerKey]];
}

- (NSURL *)authorizationEndpoint {
  return [NSURL URLWithString:_discoveryDictionary[kAuthorizationEndpointKey]];
}

- (NSURL *)tokenEndpoint {
  return [NSURL URLWithString:_discoveryDictionary[kTokenEndpointKey]];
}

- (nullable NSURL *)userinfoEndpoint {
  return [NSURL URLWithString:_discoveryDictionary[kUserinfoEndpointKey]];
}

- (NSURL *)jwksURL {
  return [NSURL URLWithString:_discoveryDictionary[kJWKSURLKey]];
}

- (nullable NSURL *)registrationEndpoint {
  return [NSURL URLWithString:_discoveryDictionary[kRegistrationEndpointKey]];
}

- (nullable NSURL *)endSessionEndpoint {
    return [NSURL URLWithString:_discoveryDictionary[kEndSessionEndpointKey]];
}

- (nullable NSArray<NSString *> *)scopesSupported {
  return _discoveryDictionary[kScopesSupportedKey];
}

- (NSArray<NSString *> *)responseTypesSupported {
  return _discoveryDictionary[kResponseTypesSupportedKey];
}

- (nullable NSArray<NSString *> *)responseModesSupported {
  return _discoveryDictionary[kResponseModesSupportedKey];
}

- (nullable NSArray<NSString *> *)grantTypesSupported {
  return _discoveryDictionary[kGrantTypesSupportedKey];
}

- (nullable NSArray<NSString *> *)acrValuesSupported {
  return _discoveryDictionary[kACRValuesSupportedKey];
}

- (NSArray<NSString *> *)subjectTypesSupported {
  return _discoveryDictionary[kSubjectTypesSupportedKey];
}

- (NSArray<NSString *> *) IDTokenSigningAlgorithmValuesSupported {
  return _discoveryDictionary[kIDTokenSigningAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)IDTokenEncryptionAlgorithmValuesSupported {
  return _discoveryDictionary[kIDTokenEncryptionAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)IDTokenEncryptionEncodingValuesSupported {
  return _discoveryDictionary[kIDTokenEncryptionEncodingValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)userinfoSigningAlgorithmValuesSupported {
  return _discoveryDictionary[kUserinfoSigningAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)userinfoEncryptionAlgorithmValuesSupported {
  return _discoveryDictionary[kUserinfoEncryptionAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)userinfoEncryptionEncodingValuesSupported {
  return _discoveryDictionary[kUserinfoEncryptionEncodingValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)requestObjectSigningAlgorithmValuesSupported {
  return _discoveryDictionary[kRequestObjectSigningAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *) requestObjectEncryptionAlgorithmValuesSupported {
  return _discoveryDictionary[kRequestObjectEncryptionAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *) requestObjectEncryptionEncodingValuesSupported {
  return _discoveryDictionary[kRequestObjectEncryptionEncodingValuesSupported];
}

- (nullable NSArray<NSString *> *)tokenEndpointAuthMethodsSupported {
  return _discoveryDictionary[kTokenEndpointAuthMethodsSupportedKey];
}

- (nullable NSArray<NSString *> *)tokenEndpointAuthSigningAlgorithmValuesSupported {
  return _discoveryDictionary[kTokenEndpointAuthSigningAlgorithmValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)displayValuesSupported {
  return _discoveryDictionary[kDisplayValuesSupportedKey];
}

- (nullable NSArray<NSString *> *)claimTypesSupported {
  return _discoveryDictionary[kClaimTypesSupportedKey];
}

- (nullable NSArray<NSString *> *)claimsSupported {
  return _discoveryDictionary[kClaimsSupportedKey];
}

- (nullable NSURL *)serviceDocumentation {
  return [NSURL URLWithString:_discoveryDictionary[kServiceDocumentationKey]];
}

- (nullable NSArray<NSString *> *)claimsLocalesSupported {
  return _discoveryDictionary[kClaimsLocalesSupportedKey];
}

- (nullable NSArray<NSString *> *)UILocalesSupported {
  return _discoveryDictionary[kUILocalesSupportedKey];
}

- (BOOL)claimsParameterSupported {
  return [_discoveryDictionary[kClaimsParameterSupportedKey] boolValue];
}

- (BOOL)requestParameterSupported {
  return [_discoveryDictionary[kRequestParameterSupportedKey] boolValue];
}

- (BOOL)requestURIParameterSupported {
  // Default is true/YES.
  if (!_discoveryDictionary[kRequestURIParameterSupportedKey]) {
    return YES;
  }
  return [_discoveryDictionary[kRequestURIParameterSupportedKey] boolValue];
}

- (BOOL)requireRequestURIRegistration {
  return [_discoveryDictionary[kRequireRequestURIRegistrationKey] boolValue];
}

- (nullable NSURL *)OPPolicyURI {
  return [NSURL URLWithString:_discoveryDictionary[kOPPolicyURIKey]];
}

- (nullable NSURL *)OPTosURI {
  return [NSURL URLWithString:_discoveryDictionary[kOPTosURIKey]];
}

@end

NS_ASSUME_NONNULL_END
