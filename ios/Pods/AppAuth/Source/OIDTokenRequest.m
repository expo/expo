/*! @file OIDTokenRequest.m
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

#import "OIDTokenRequest.h"

#import "OIDDefines.h"
#import "OIDError.h"
#import "OIDScopeUtilities.h"
#import "OIDServiceConfiguration.h"
#import "OIDURLQueryComponent.h"
#import "OIDTokenUtilities.h"

/*! @brief The key for the @c configuration property for @c NSSecureCoding
 */
static NSString *const kConfigurationKey = @"configuration";

/*! @brief Key used to encode the @c grantType property for @c NSSecureCoding
 */
static NSString *const kGrantTypeKey = @"grant_type";

/*! @brief The key for the @c authorizationCode property for @c NSSecureCoding.
 */
static NSString *const kAuthorizationCodeKey = @"code";

/*! @brief Key used to encode the @c clientID property for @c NSSecureCoding
 */
static NSString *const kClientIDKey = @"client_id";

/*! @brief Key used to encode the @c clientSecret property for @c NSSecureCoding
 */
static NSString *const kClientSecretKey = @"client_secret";

/*! @brief Key used to encode the @c redirectURL property for @c NSSecureCoding
 */
static NSString *const kRedirectURLKey = @"redirect_uri";

/*! @brief Key used to encode the @c scopes property for @c NSSecureCoding
 */
static NSString *const kScopeKey = @"scope";

/*! @brief Key used to encode the @c refreshToken property for @c NSSecureCoding
 */
static NSString *const kRefreshTokenKey = @"refresh_token";

/*! @brief Key used to encode the @c codeVerifier property for @c NSSecureCoding and to build the
        request URL.
 */
static NSString *const kCodeVerifierKey = @"code_verifier";

/*! @brief Key used to encode the @c additionalParameters property for
        @c NSSecureCoding
 */
static NSString *const kAdditionalParametersKey = @"additionalParameters";

@implementation OIDTokenRequest

- (instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(
        @selector(initWithConfiguration:
                              grantType:
                      authorizationCode:
                            redirectURL:
                               clientID:
                           clientSecret:
                                  scope:
                           refreshToken:
                           codeVerifier:
                   additionalParameters:)
    )

- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               grantType:(NSString *)grantType
       authorizationCode:(nullable NSString *)code
             redirectURL:(nullable NSURL *)redirectURL
                clientID:(NSString *)clientID
            clientSecret:(nullable NSString *)clientSecret
                  scopes:(nullable NSArray<NSString *> *)scopes
            refreshToken:(nullable NSString *)refreshToken
            codeVerifier:(nullable NSString *)codeVerifier
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  return [self initWithConfiguration:configuration
                           grantType:grantType
                   authorizationCode:code
                         redirectURL:redirectURL
                            clientID:clientID
                        clientSecret:clientSecret
                               scope:[OIDScopeUtilities scopesWithArray:scopes]
                        refreshToken:refreshToken
                        codeVerifier:(NSString *)codeVerifier
                additionalParameters:additionalParameters];
}

- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               grantType:(NSString *)grantType
       authorizationCode:(nullable NSString *)code
             redirectURL:(nullable NSURL *)redirectURL
                clientID:(NSString *)clientID
            clientSecret:(nullable NSString *)clientSecret
                   scope:(nullable NSString *)scope
            refreshToken:(nullable NSString *)refreshToken
            codeVerifier:(nullable NSString *)codeVerifier
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  self = [super init];
  if (self) {
    _configuration = [configuration copy];
    _grantType = [grantType copy];
    _authorizationCode = [code copy];
    _redirectURL = [redirectURL copy];
    _clientID = [clientID copy];
    _clientSecret = [clientSecret copy];
    _scope = [scope copy];
    _refreshToken = [refreshToken copy];
    _codeVerifier = [codeVerifier copy];
    _additionalParameters =
        [[NSDictionary alloc] initWithDictionary:additionalParameters copyItems:YES];
    
    // Additional validation for the authorization_code grant type
    if ([_grantType isEqual:OIDGrantTypeAuthorizationCode]) {
      // redirect URI must not be nil
      if (!_redirectURL) {
        [NSException raise:OIDOAuthExceptionInvalidTokenRequestNullRedirectURL
                    format:@"%@", OIDOAuthExceptionInvalidTokenRequestNullRedirectURL, nil];

      }
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

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  OIDServiceConfiguration *configuration =
      [aDecoder decodeObjectOfClass:[OIDServiceConfiguration class]
                             forKey:kConfigurationKey];
  NSString *grantType = [aDecoder decodeObjectOfClass:[NSString class] forKey:kGrantTypeKey];
  NSString *code = [aDecoder decodeObjectOfClass:[NSString class] forKey:kAuthorizationCodeKey];
  NSString *clientID = [aDecoder decodeObjectOfClass:[NSString class] forKey:kClientIDKey];
  NSString *clientSecret = [aDecoder decodeObjectOfClass:[NSString class] forKey:kClientSecretKey];
  NSString *scope = [aDecoder decodeObjectOfClass:[NSString class] forKey:kScopeKey];
  NSString *refreshToken = [aDecoder decodeObjectOfClass:[NSString class] forKey:kRefreshTokenKey];
  NSString *codeVerifier = [aDecoder decodeObjectOfClass:[NSString class] forKey:kCodeVerifierKey];
  NSURL *redirectURL = [aDecoder decodeObjectOfClass:[NSURL class] forKey:kRedirectURLKey];
  NSSet *additionalParameterCodingClasses = [NSSet setWithArray:@[
    [NSDictionary class],
    [NSString class]
  ]];
  NSDictionary *additionalParameters =
      [aDecoder decodeObjectOfClasses:additionalParameterCodingClasses
                               forKey:kAdditionalParametersKey];
  self = [self initWithConfiguration:configuration
                           grantType:grantType
                   authorizationCode:code
                         redirectURL:redirectURL
                            clientID:clientID
                        clientSecret:clientSecret
                               scope:scope
                        refreshToken:refreshToken
                        codeVerifier:codeVerifier
                additionalParameters:additionalParameters];
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_configuration forKey:kConfigurationKey];
  [aCoder encodeObject:_grantType forKey:kGrantTypeKey];
  [aCoder encodeObject:_authorizationCode forKey:kAuthorizationCodeKey];
  [aCoder encodeObject:_clientID forKey:kClientIDKey];
  [aCoder encodeObject:_clientSecret forKey:kClientSecretKey];
  [aCoder encodeObject:_redirectURL forKey:kRedirectURLKey];
  [aCoder encodeObject:_scope forKey:kScopeKey];
  [aCoder encodeObject:_refreshToken forKey:kRefreshTokenKey];
  [aCoder encodeObject:_codeVerifier forKey:kCodeVerifierKey];
  [aCoder encodeObject:_additionalParameters forKey:kAdditionalParametersKey];
}

#pragma mark - NSObject overrides

- (NSString *)description {
  NSURLRequest *request = self.URLRequest;
  NSString *requestBody =
      [[NSString alloc] initWithData:request.HTTPBody encoding:NSUTF8StringEncoding];
  return [NSString stringWithFormat:@"<%@: %p, request: <URL: %@, HTTPBody: %@>>",
                                    NSStringFromClass([self class]),
                                    (void *)self,
                                    request.URL,
                                    requestBody];
}

#pragma mark -

/*! @brief Constructs the request URI.
    @return A URL representing the token request.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
- (NSURL *)tokenRequestURL {
  return _configuration.tokenEndpoint;
}

/*! @brief Constructs the request body data by combining the request parameters using the
        "application/x-www-form-urlencoded" format.
    @return The data to pass to the token request URL.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
- (OIDURLQueryComponent *)tokenRequestBody {
  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] init];

  // Add parameters, as applicable.
  if (_grantType) {
    [query addParameter:kGrantTypeKey value:_grantType];
  }
  if (_scope) {
    [query addParameter:kScopeKey value:_scope];
  }
  if (_redirectURL) {
    [query addParameter:kRedirectURLKey value:_redirectURL.absoluteString];
  }
  if (_refreshToken) {
    [query addParameter:kRefreshTokenKey value:_refreshToken];
  }
  if (_authorizationCode) {
    [query addParameter:kAuthorizationCodeKey value:_authorizationCode];
  }
  if (_codeVerifier) {
    [query addParameter:kCodeVerifierKey value:_codeVerifier];
  }

  // Add any additional parameters the client has specified.
  [query addParameters:_additionalParameters];

  return query;
}

- (NSURLRequest *)URLRequest {
  static NSString *const kHTTPPost = @"POST";
  static NSString *const kHTTPContentTypeHeaderKey = @"Content-Type";
  static NSString *const kHTTPContentTypeHeaderValue =
      @"application/x-www-form-urlencoded; charset=UTF-8";

  NSURL *tokenRequestURL = [self tokenRequestURL];
  NSMutableURLRequest *URLRequest = [[NSURLRequest requestWithURL:tokenRequestURL] mutableCopy];
  URLRequest.HTTPMethod = kHTTPPost;
  [URLRequest setValue:kHTTPContentTypeHeaderValue forHTTPHeaderField:kHTTPContentTypeHeaderKey];

  OIDURLQueryComponent *bodyParameters = [self tokenRequestBody];
  NSMutableDictionary *httpHeaders = [[NSMutableDictionary alloc] init];

  if (_clientSecret) {
    // The client id and secret are encoded using the "application/x-www-form-urlencoded" 
    // encoding algorithm per RFC 6749 Section 2.3.1.
    // https://tools.ietf.org/html/rfc6749#section-2.3.1
    NSString *encodedClientID = [OIDTokenUtilities formUrlEncode:_clientID];
    NSString *encodedClientSecret = [OIDTokenUtilities formUrlEncode:_clientSecret];
    
    NSString *credentials =
        [NSString stringWithFormat:@"%@:%@", encodedClientID, encodedClientSecret];
    NSData *plainData = [credentials dataUsingEncoding:NSUTF8StringEncoding];
    NSString *basicAuth = [plainData base64EncodedStringWithOptions:kNilOptions];

    NSString *authValue = [NSString stringWithFormat:@"Basic %@", basicAuth];
    [httpHeaders setObject:authValue forKey:@"Authorization"];
  } else  {
    [bodyParameters addParameter:kClientIDKey value:_clientID];
  }

  // Constructs request with the body string and headers.
  NSString *bodyString = [bodyParameters URLEncodedParameters];
  NSData *body = [bodyString dataUsingEncoding:NSUTF8StringEncoding];
  URLRequest.HTTPBody = body;

  for (id header in httpHeaders) {
    [URLRequest setValue:httpHeaders[header] forHTTPHeaderField:header];
  }

  return URLRequest;
}

@end
