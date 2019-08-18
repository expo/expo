/*! @file OIDAuthorizationRequest.m
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

#import "OIDAuthorizationRequest.h"

#import "OIDDefines.h"
#import "OIDScopeUtilities.h"
#import "OIDServiceConfiguration.h"
#import "OIDTokenUtilities.h"
#import "OIDURLQueryComponent.h"

/*! @brief The key for the @c configuration property for @c NSSecureCoding
 */
static NSString *const kConfigurationKey = @"configuration";

/*! @brief Key used to encode the @c responseType property for @c NSSecureCoding, and on the URL
        request.
 */
static NSString *const kResponseTypeKey = @"response_type";

/*! @brief Key used to encode the @c clientID property for @c NSSecureCoding, and on the URL
        request.
 */
static NSString *const kClientIDKey = @"client_id";

/*! @brief Key used to encode the @c clientSecret property for @c NSSecureCoding.
 */
static NSString *const kClientSecretKey = @"client_secret";

/*! @brief Key used to encode the @c scope property for @c NSSecureCoding, and on the URL request.
 */
static NSString *const kScopeKey = @"scope";

/*! @brief Key used to encode the @c redirectURL property for @c NSSecureCoding, and on the URL
        request.
 */
static NSString *const kRedirectURLKey = @"redirect_uri";

/*! @brief Key used to encode the @c state property for @c NSSecureCoding, and on the URL request.
 */
static NSString *const kStateKey = @"state";

/*! @brief Key used to encode the @c nonce property for @c NSSecureCoding, and on the URL request.
 */
static NSString *const kNonceKey = @"nonce";

/*! @brief Key used to encode the @c codeVerifier property for @c NSSecureCoding.
 */
static NSString *const kCodeVerifierKey = @"code_verifier";

/*! @brief Key used to send the @c codeChallenge on the URL request.
 */
static NSString *const kCodeChallengeKey = @"code_challenge";

/*! @brief Key used to send the @c codeChallengeMethod on the URL request.
 */
static NSString *const kCodeChallengeMethodKey = @"code_challenge_method";

/*! @brief Key used to encode the @c additionalParameters property for
        @c NSSecureCoding
 */
static NSString *const kAdditionalParametersKey = @"additionalParameters";

/*! @brief Number of random bytes generated for the @ state.
 */
static NSUInteger const kStateSizeBytes = 32;

/*! @brief Number of random bytes generated for the @ codeVerifier.
 */
static NSUInteger const kCodeVerifierBytes = 32;

/*! @brief Assertion text for unsupported response types.
 */
static NSString *const OIDOAuthUnsupportedResponseTypeMessage =
    @"The response_type \"%@\" isn't supported. AppAuth only supports the \"code\" response_type.";

/*! @brief Code challenge request method.
 */
NSString *const OIDOAuthorizationRequestCodeChallengeMethodS256 = @"S256";

@implementation OIDAuthorizationRequest

@synthesize configuration = _configuration;
@synthesize responseType = _responseType;
@synthesize clientID = _clientID;
@synthesize clientSecret = _clientSecret;
@synthesize scope = _scope;
@synthesize redirectURL = _redirectURL;
@synthesize state = _state;
@synthesize nonce = _nonce;
@synthesize codeVerifier = _codeVerifier;
@synthesize codeChallenge = _codeChallenge;
@synthesize codeChallengeMethod = _codeChallengeMethod;
@synthesize additionalParameters = _additionalParameters;

- (instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(
        @selector(initWithConfiguration:
                               clientId:
                                 scopes:
                            redirectURL:
                           responseType:
                   additionalParameters:)
    )

- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
                clientId:(NSString *)clientID
            clientSecret:(nullable NSString *)clientSecret
                   scope:(nullable NSString *)scope
             redirectURL:(NSURL *)redirectURL
            responseType:(NSString *)responseType
                   state:(nullable NSString *)state
                   nonce:(nullable NSString *)nonce
            codeVerifier:(nullable NSString *)codeVerifier
           codeChallenge:(nullable NSString *)codeChallenge
     codeChallengeMethod:(nullable NSString *)codeChallengeMethod
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters
{
  self = [super init];
  if (self) {
    _configuration = [configuration copy];
    _clientID = [clientID copy];
    _clientSecret = [clientSecret copy];
    _scope = [scope copy];
    _redirectURL = [redirectURL copy];
    _responseType = [responseType copy];
    // Attention: Please refer to https://github.com/openid/AppAuth-iOS/issues/105
    // If you change the restriction on response type here, you must also update initWithCoder:
    if (![_responseType isEqualToString:OIDResponseTypeCode]) {
      // AppAuth only supports the `code` response type.
      // Discussion: https://github.com/openid/AppAuth-iOS/issues/98
      NSAssert(NO, OIDOAuthUnsupportedResponseTypeMessage, _responseType);
      return nil;
    }
    _state = [state copy];
    _nonce = [nonce copy];
    _codeVerifier = [codeVerifier copy];
    _codeChallenge = [codeChallenge copy];
    _codeChallengeMethod = [codeChallengeMethod copy];

    _additionalParameters =
        [[NSDictionary alloc] initWithDictionary:additionalParameters copyItems:YES];
  }
  return self;
}

// Deprecated
- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
                             clientId:(NSString *)clientID
                         clientSecret:(nullable NSString *)clientSecret
                                scope:(nullable NSString *)scope
                          redirectURL:(NSURL *)redirectURL
                         responseType:(NSString *)responseType
                                state:(nullable NSString *)state
                         codeVerifier:(nullable NSString *)codeVerifier
                        codeChallenge:(nullable NSString *)codeChallenge
                  codeChallengeMethod:(nullable NSString *)codeChallengeMethod
                 additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  return [self initWithConfiguration:configuration
                            clientId:clientID
                        clientSecret:clientSecret
                               scope:scope
                         redirectURL:redirectURL
                        responseType:responseType
                               state:state
                               nonce:nil
                        codeVerifier:codeVerifier
                       codeChallenge:codeChallenge
                 codeChallengeMethod:OIDOAuthorizationRequestCodeChallengeMethodS256
                additionalParameters:additionalParameters];
}

- (instancetype)
   initWithConfiguration:(OIDServiceConfiguration *)configuration
                clientId:(NSString *)clientID
            clientSecret:(NSString *)clientSecret
                  scopes:(nullable NSArray<NSString *> *)scopes
             redirectURL:(NSURL *)redirectURL
            responseType:(NSString *)responseType
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {

  // generates PKCE code verifier and challenge
  NSString *codeVerifier = [[self class] generateCodeVerifier];
  NSString *codeChallenge = [[self class] codeChallengeS256ForVerifier:codeVerifier];

  return [self initWithConfiguration:configuration
                            clientId:clientID
                        clientSecret:clientSecret
                               scope:[OIDScopeUtilities scopesWithArray:scopes]
                         redirectURL:redirectURL
                        responseType:responseType
                               state:[[self class] generateState]
                               nonce:[[self class] generateState]
                        codeVerifier:codeVerifier
                       codeChallenge:codeChallenge
                 codeChallengeMethod:OIDOAuthorizationRequestCodeChallengeMethodS256
                additionalParameters:additionalParameters];
}

- (instancetype)
    initWithConfiguration:(OIDServiceConfiguration *)configuration
                 clientId:(NSString *)clientID
                   scopes:(nullable NSArray<NSString *> *)scopes
              redirectURL:(NSURL *)redirectURL
             responseType:(NSString *)responseType
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  return [self initWithConfiguration:configuration
                            clientId:clientID
                        clientSecret:nil
                              scopes:scopes
                         redirectURL:redirectURL
                        responseType:responseType
                additionalParameters:additionalParameters];
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
  OIDServiceConfiguration *configuration =
      [aDecoder decodeObjectOfClass:[OIDServiceConfiguration class]
                             forKey:kConfigurationKey];
  // Attention: Please refer to https://github.com/openid/AppAuth-iOS/issues/105
  // If the initializer relaxes it's restriction on the response type field, this code must also
  // be updated to re-enable use of the serialized responseType value. The value of 'code' here
  // is only a valid assumption for that reason.
  // [aDecoder decodeObjectOfClass:[NSString class] forKey:kResponseTypeKey];
  NSString *responseType = OIDResponseTypeCode;
  NSString *clientID = [aDecoder decodeObjectOfClass:[NSString class] forKey:kClientIDKey];
  NSString *clientSecret = [aDecoder decodeObjectOfClass:[NSString class] forKey:kClientSecretKey];
  NSString *scope = [aDecoder decodeObjectOfClass:[NSString class] forKey:kScopeKey];
  NSURL *redirectURL = [aDecoder decodeObjectOfClass:[NSURL class] forKey:kRedirectURLKey];
  NSString *state = [aDecoder decodeObjectOfClass:[NSString class] forKey:kStateKey];
  NSString *nonce = [aDecoder decodeObjectOfClass:[NSString class] forKey:kNonceKey];
  NSString *codeVerifier = [aDecoder decodeObjectOfClass:[NSString class] forKey:kCodeVerifierKey];
  NSString *codeChallenge =
      [aDecoder decodeObjectOfClass:[NSString class] forKey:kCodeChallengeKey];
  NSString *codeChallengeMethod =
      [aDecoder decodeObjectOfClass:[NSString class] forKey:kCodeChallengeMethodKey];
  NSSet *additionalParameterCodingClasses = [NSSet setWithArray:@[
    [NSDictionary class],
    [NSString class]
  ]];
  NSDictionary *additionalParameters =
      [aDecoder decodeObjectOfClasses:additionalParameterCodingClasses
                               forKey:kAdditionalParametersKey];

  self = [self initWithConfiguration:configuration
                            clientId:clientID
                        clientSecret:clientSecret
                               scope:scope
                         redirectURL:redirectURL
                        responseType:responseType
                               state:state
                               nonce:nonce
                        codeVerifier:codeVerifier
                       codeChallenge:codeChallenge
                 codeChallengeMethod:codeChallengeMethod
                additionalParameters:additionalParameters];
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_configuration forKey:kConfigurationKey];
  [aCoder encodeObject:_responseType forKey:kResponseTypeKey];
  [aCoder encodeObject:_clientID forKey:kClientIDKey];
  [aCoder encodeObject:_clientSecret forKey:kClientSecretKey];
  [aCoder encodeObject:_scope forKey:kScopeKey];
  [aCoder encodeObject:_redirectURL forKey:kRedirectURLKey];
  [aCoder encodeObject:_state forKey:kStateKey];
  [aCoder encodeObject:_nonce forKey:kNonceKey];
  [aCoder encodeObject:_codeVerifier forKey:kCodeVerifierKey];
  [aCoder encodeObject:_codeChallenge forKey:kCodeChallengeKey];
  [aCoder encodeObject:_codeChallengeMethod forKey:kCodeChallengeMethodKey];
  [aCoder encodeObject:_additionalParameters forKey:kAdditionalParametersKey];
}

#pragma mark - NSObject overrides

- (NSString *)description {
  return [NSString stringWithFormat:@"<%@: %p, request: %@>",
                                    NSStringFromClass([self class]),
                                    (void *)self,
                                    self.authorizationRequestURL];
}

#pragma mark - State and PKCE verifier/challenge generation Methods

+ (nullable NSString *)generateCodeVerifier {
  return [OIDTokenUtilities randomURLSafeStringWithSize:kCodeVerifierBytes];
}

+ (nullable NSString *)generateState {
  return [OIDTokenUtilities randomURLSafeStringWithSize:kStateSizeBytes];
}

+ (nullable NSString *)codeChallengeS256ForVerifier:(NSString *)codeVerifier {
  if (!codeVerifier) {
    return nil;
  }
  // generates the code_challenge per spec https://tools.ietf.org/html/rfc7636#section-4.2
  // code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
  // NB. the ASCII conversion on the code_verifier entropy was done at time of generation.
  NSData *sha256Verifier = [OIDTokenUtilities sha265:codeVerifier];
  return [OIDTokenUtilities encodeBase64urlNoPadding:sha256Verifier];
}

#pragma mark -

- (NSURL *)authorizationRequestURL {
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];

  // Required parameters.
  [query addParameter:kResponseTypeKey value:_responseType];
  [query addParameter:kClientIDKey value:_clientID];

  // Add any additional parameters the client has specified.
  [query addParameters:_additionalParameters];

  // Add optional parameters, as applicable.
  if (_redirectURL) {
    [query addParameter:kRedirectURLKey value:_redirectURL.absoluteString];
  }
  if (_scope) {
    [query addParameter:kScopeKey value:_scope];
  }
  if (_state) {
    [query addParameter:kStateKey value:_state];
  }
  if (_nonce) {
    [query addParameter:kNonceKey value:_nonce];
  }
  if (_codeChallenge) {
    [query addParameter:kCodeChallengeKey value:_codeChallenge];
  }
  if (_codeChallengeMethod) {
    [query addParameter:kCodeChallengeMethodKey value:_codeChallengeMethod];
  }

  // Construct the URL:
  return [query URLByReplacingQueryInURL:_configuration.authorizationEndpoint];
}

#pragma mark - OIDExternalUserAgentRequest

- (NSURL *)externalUserAgentRequestURL {
  return [self authorizationRequestURL];
}

- (NSString *)redirectScheme {
  return [[self redirectURL] scheme];
}

@end
