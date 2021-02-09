/*! @file OIDRegistrationRequest.m
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

#import "OIDRegistrationRequest.h"

#import "OIDClientMetadataParameters.h"
#import "OIDDefines.h"
#import "OIDServiceConfiguration.h"

/*! @brief The key for the @c configuration property for @c NSSecureCoding
 */
static NSString *const kConfigurationKey = @"configuration";

/*! @brief The key for the @c initialAccessToken property for @c NSSecureCoding
 */
static NSString *const kInitialAccessToken  = @"initial_access_token";

/*! @brief Key used to encode the @c redirectURIs property for @c NSSecureCoding
 */
static NSString *const kRedirectURIsKey = @"redirect_uris";

/*! @brief The key for the @c responseTypes property for @c NSSecureCoding.
 */
static NSString *const kResponseTypesKey = @"response_types";

/*! @brief Key used to encode the @c grantType property for @c NSSecureCoding
 */
static NSString *const kGrantTypesKey = @"grant_types";

/*! @brief Key used to encode the @c subjectType property for @c NSSecureCoding
 */
static NSString *const kSubjectTypeKey = @"subject_type";

/*! @brief Key used to encode the @c additionalParameters property for
        @c NSSecureCoding
 */
static NSString *const kAdditionalParametersKey = @"additionalParameters";

@implementation OIDRegistrationRequest

#pragma mark - Initializers

- (instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(
        @selector(initWithConfiguration:
                           redirectURIs:
                          responseTypes:
                             grantTypes:
                            subjectType:
                tokenEndpointAuthMethod:
                   additionalParameters:)
    )

- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
            redirectURIs:(NSArray<NSURL *> *)redirectURIs
           responseTypes:(nullable NSArray<NSString *> *)responseTypes
              grantTypes:(nullable NSArray<NSString *> *)grantTypes
             subjectType:(nullable NSString *)subjectType
 tokenEndpointAuthMethod:(nullable NSString *)tokenEndpointAuthenticationMethod
    additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  return [self initWithConfiguration:configuration
                        redirectURIs:redirectURIs
                       responseTypes:responseTypes
                          grantTypes:grantTypes
                         subjectType:subjectType
             tokenEndpointAuthMethod:tokenEndpointAuthenticationMethod
                  initialAccessToken:nil
                additionalParameters:additionalParameters];
}

- (instancetype)initWithConfiguration:(OIDServiceConfiguration *)configuration
               redirectURIs:(NSArray<NSURL *> *)redirectURIs
              responseTypes:(nullable NSArray<NSString *> *)responseTypes
                 grantTypes:(nullable NSArray<NSString *> *)grantTypes
                subjectType:(nullable NSString *)subjectType
    tokenEndpointAuthMethod:(nullable NSString *)tokenEndpointAuthenticationMethod
         initialAccessToken:(nullable NSString *)initialAccessToken
       additionalParameters:(nullable NSDictionary<NSString *, NSString *> *)additionalParameters {
  self = [super init];
  if (self) {
    _configuration = [configuration copy];
    _initialAccessToken = [initialAccessToken copy];
    _redirectURIs = [redirectURIs copy];
    _responseTypes = [responseTypes copy];
    _grantTypes = [grantTypes copy];
    _subjectType = [subjectType copy];
    _tokenEndpointAuthenticationMethod = [tokenEndpointAuthenticationMethod copy];
    _additionalParameters =
        [[NSDictionary alloc] initWithDictionary:additionalParameters copyItems:YES];

    _applicationType = OIDApplicationTypeNative;
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
  NSString *initialAccessToken = [aDecoder decodeObjectOfClass:[NSString class]
                                                        forKey:kInitialAccessToken];
  NSArray<NSURL *> *redirectURIs = [aDecoder decodeObjectOfClass:[NSArray<NSURL *> class]
                                                          forKey:kRedirectURIsKey];
  NSArray<NSString *> *responseTypes = [aDecoder decodeObjectOfClass:[NSArray<NSString *> class]
                                                              forKey:kResponseTypesKey];
  NSArray<NSString *> *grantTypes = [aDecoder decodeObjectOfClass:[NSArray<NSString *> class]
                                                           forKey:kGrantTypesKey];
  NSString *subjectType = [aDecoder decodeObjectOfClass:[NSString class]
                                                 forKey:kSubjectTypeKey];
  NSString *tokenEndpointAuthenticationMethod =
      [aDecoder decodeObjectOfClass:[NSString class]
                             forKey:OIDTokenEndpointAuthenticationMethodParam];
  NSSet *additionalParameterCodingClasses = [NSSet setWithArray:@[ [NSDictionary class],
                                                                   [NSString class] ]];
  NSDictionary *additionalParameters =
      [aDecoder decodeObjectOfClasses:additionalParameterCodingClasses
                               forKey:kAdditionalParametersKey];
  self = [self initWithConfiguration:configuration
                        redirectURIs:redirectURIs
                       responseTypes:responseTypes
                          grantTypes:grantTypes
                         subjectType:subjectType
             tokenEndpointAuthMethod:tokenEndpointAuthenticationMethod
                  initialAccessToken:initialAccessToken
                additionalParameters:additionalParameters];
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_configuration forKey:kConfigurationKey];
  [aCoder encodeObject:_initialAccessToken forKey:kInitialAccessToken];
  [aCoder encodeObject:_redirectURIs forKey:kRedirectURIsKey];
  [aCoder encodeObject:_responseTypes forKey:kResponseTypesKey];
  [aCoder encodeObject:_grantTypes forKey:kGrantTypesKey];
  [aCoder encodeObject:_subjectType forKey:kSubjectTypeKey];
  [aCoder encodeObject:_tokenEndpointAuthenticationMethod
                forKey:OIDTokenEndpointAuthenticationMethodParam];
  [aCoder encodeObject:_additionalParameters forKey:kAdditionalParametersKey];
}

#pragma mark - NSObject overrides

- (NSString *)description {
  NSURLRequest *request = [self URLRequest];
  NSString *requestBody = [[NSString alloc] initWithData:request.HTTPBody
                                                encoding:NSUTF8StringEncoding];
  return [NSString stringWithFormat:@"<%@: %p, request: <URL: %@, HTTPBody: %@>>",
                                    NSStringFromClass([self class]),
                                    (void *)self,
                                    request.URL,
                                    requestBody];
}

- (NSURLRequest *)URLRequest {
  static NSString *const kHTTPPost = @"POST";
  static NSString *const kBearer = @"Bearer";
  static NSString *const kHTTPContentTypeHeaderKey = @"Content-Type";
  static NSString *const kHTTPContentTypeHeaderValue = @"application/json";
  static NSString *const kHTTPAuthorizationHeaderKey = @"Authorization";

  NSData *postBody = [self JSONString];
  if (!postBody) {
    return nil;
  }

  NSURL *registrationRequestURL = _configuration.registrationEndpoint;
  NSMutableURLRequest *URLRequest =
      [[NSURLRequest requestWithURL:registrationRequestURL] mutableCopy];
  URLRequest.HTTPMethod = kHTTPPost;
  [URLRequest setValue:kHTTPContentTypeHeaderValue forHTTPHeaderField:kHTTPContentTypeHeaderKey];
  if (_initialAccessToken) {
    NSString *value = [NSString stringWithFormat:@"%@ %@", kBearer, _initialAccessToken];
    [URLRequest setValue:value forHTTPHeaderField:kHTTPAuthorizationHeaderKey];
  }
  URLRequest.HTTPBody = postBody;
  return URLRequest;
}

- (NSData *)JSONString {
  // Dictionary with several kay/value pairs and the above array of arrays
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  NSMutableArray<NSString *> *redirectURIStrings =
  [NSMutableArray arrayWithCapacity:[_redirectURIs count]];
  for (id obj in _redirectURIs) {
    [redirectURIStrings addObject:[obj absoluteString]];
  }
  dict[OIDRedirectURIsParam] = redirectURIStrings;
  dict[OIDApplicationTypeParam] = _applicationType;

  if (_additionalParameters) {
    // Add any additional parameters first to allow them
    // to be overwritten by instance values
    [dict addEntriesFromDictionary:_additionalParameters];
  }
  if (_responseTypes) {
    dict[OIDResponseTypesParam] = _responseTypes;
  }
  if (_grantTypes) {
    dict[OIDGrantTypesParam] = _grantTypes;
  }
  if (_subjectType) {
    dict[OIDSubjectTypeParam] = _subjectType;
  }
  if (_tokenEndpointAuthenticationMethod) {
    dict[OIDTokenEndpointAuthenticationMethodParam] = _tokenEndpointAuthenticationMethod;
  }

  NSError *error;
  NSData *json = [NSJSONSerialization dataWithJSONObject:dict options:kNilOptions error:&error];
  if (json == nil || error != nil) {
    return nil;
  }

  return json;
}

@end
