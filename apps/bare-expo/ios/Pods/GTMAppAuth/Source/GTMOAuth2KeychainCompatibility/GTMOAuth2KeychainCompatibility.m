/*! @file GTMOAuth2Compatibility.m
    @brief GTMAppAuth SDK
    @copyright
        Copyright 2016 Google Inc.
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

#import "GTMOAuth2KeychainCompatibility.h"

#ifndef GTMAPPAUTH_USER_IMPORTS
#import <AppAuth/AppAuthCore.h>
#else // GTMAPPAUTH_USER_IMPORTS
#import "AppAuthCore.h"
#endif // GTMAPPAUTH_USER_IMPORTS

#import "GTMKeychain.h"

// standard OAuth keys
static NSString *const kOAuth2AccessTokenKey = @"access_token";
static NSString *const kOAuth2RefreshTokenKey = @"refresh_token";
static NSString *const kOAuth2ScopeKey = @"scope";
static NSString *const kOAuth2ErrorKey = @"error";
static NSString *const kOAuth2TokenTypeKey = @"token_type";
static NSString *const kOAuth2ExpiresInKey = @"expires_in";
static NSString *const kOAuth2CodeKey = @"code";
static NSString *const kOAuth2AssertionKey = @"assertion";
static NSString *const kOAuth2RefreshScopeKey = @"refreshScope";

// additional persistent keys
static NSString *const kServiceProviderKey = @"serviceProvider";
static NSString *const kUserIDKey = @"userID";
static NSString *const kUserEmailKey = @"email";
static NSString *const kUserEmailIsVerifiedKey = @"isVerified";

// URI indicating an installed app is signing in. This is described at
//
// https://developers.google.com/identity/protocols/OAuth2InstalledApp#formingtheurl
//
static NSString *const kOOBString = @"urn:ietf:wg:oauth:2.0:oob";

@implementation GTMOAuth2KeychainCompatibility

// This returns a "response string" that can be passed later to
// setKeysForResponseString: to reuse an old access token in a new auth object
+ (NSString *)persistenceResponseStringForAuthorization:
    (GTMAppAuthFetcherAuthorization *)authorization {
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

  NSString *refreshToken = authorization.authState.refreshToken;
  NSString *accessToken = authorization.authState.lastTokenResponse.accessToken;

  // Any nil values will not set a dictionary entry
  [dict setValue:refreshToken forKey:kOAuth2RefreshTokenKey];
  [dict setValue:accessToken forKey:kOAuth2AccessTokenKey];
  [dict setValue:authorization.serviceProvider forKey:kServiceProviderKey];
  [dict setValue:authorization.userID forKey:kUserIDKey];
  [dict setValue:authorization.userEmail forKey:kUserEmailKey];
  [dict setValue:authorization.userEmailIsVerified forKey:kUserEmailIsVerifiedKey];
  [dict setValue:authorization.authState.scope forKey:kOAuth2ScopeKey];

  NSString *result = [self encodedQueryParametersForDictionary:dict];
  return result;
}

+ (GTMAppAuthFetcherAuthorization *)authorizeFromKeychainForName:(NSString *)keychainItemName
        tokenURL:(NSURL *)tokenURL
     redirectURI:(NSString *)redirectURI
        clientID:(NSString *)clientID
    clientSecret:(nullable NSString *)clientSecret {
  // Loads password string from keychain.
  NSString *password = [GTMKeychain passwordFromKeychainForName:keychainItemName];

  if (!password) {
    return nil;
  }

  GTMAppAuthFetcherAuthorization *authorization =
      [self authorizeFromPersistenceString:password
                                  tokenURL:tokenURL
                               redirectURI:redirectURI
                                  clientID:clientID
                              clientSecret:clientSecret];
  return authorization;
}

+ (GTMAppAuthFetcherAuthorization *)authorizeFromPersistenceString:(NSString *)persistenceString
        tokenURL:(NSURL *)tokenURL
     redirectURI:(NSString *)redirectURIString
        clientID:(NSString *)clientID
    clientSecret:(NSString *)clientSecret {
  // Parses persistence data into NSDictionary.
  NSDictionary *dict = [self dictionaryWithResponseString:persistenceString];

  NSURL *redirectURI = (NSURL *)[NSURL URLWithString:redirectURIString];

  // OIDAuthState is based on the request/response history.
  // Creates history based on the data from the keychain, and client details passed in.
  OIDServiceConfiguration *authConfig =
    [[OIDServiceConfiguration alloc] initWithAuthorizationEndpoint:tokenURL tokenEndpoint:tokenURL];
  OIDAuthorizationRequest *authRequest =
      [[OIDAuthorizationRequest alloc] initWithConfiguration:authConfig
                                                    clientId:clientID
                                                clientSecret:clientSecret
                                                       scope:dict[kOAuth2ScopeKey]
                                                 redirectURL:redirectURI
                                                responseType:OIDResponseTypeCode
                                                       state:nil
                                                       nonce:nil
                                                codeVerifier:nil
                                               codeChallenge:nil
                                         codeChallengeMethod:nil
                                        additionalParameters:nil];
  OIDAuthorizationResponse *authResponse =
      [[OIDAuthorizationResponse alloc] initWithRequest:authRequest parameters:dict];
  // Exclude scope and refresh token parameters from additionalParameters.
  NSMutableDictionary *additionalParameters = [dict mutableCopy];
  [additionalParameters removeObjectForKey:kOAuth2ScopeKey];
  [additionalParameters removeObjectForKey:kOAuth2RefreshTokenKey];
  OIDTokenRequest *tokenRequest =
      [[OIDTokenRequest alloc] initWithConfiguration:authConfig
                                           grantType:@"token"
                                   authorizationCode:nil
                                         redirectURL:redirectURI
                                            clientID:clientID
                                        clientSecret:clientSecret
                                               scope:dict[kOAuth2ScopeKey]
                                        refreshToken:dict[kOAuth2RefreshTokenKey]
                                        codeVerifier:nil
                                additionalParameters:additionalParameters];
  OIDTokenResponse *tokenResponse =
      [[OIDTokenResponse alloc] initWithRequest:tokenRequest parameters:dict];
  OIDAuthState *authState = [[OIDAuthState alloc] initWithAuthorizationResponse:authResponse
                                                                  tokenResponse:tokenResponse];
  // We're not serializing the token expiry date, so the first refresh needs to be forced.
  [authState setNeedsTokenRefresh];

  GTMAppAuthFetcherAuthorization *authorizer =
      [[GTMAppAuthFetcherAuthorization alloc] initWithAuthState:authState
                                                serviceProvider:dict[kServiceProviderKey]
                                                         userID:dict[kUserIDKey]
                                                      userEmail:dict[kUserEmailKey]
                                            userEmailIsVerified:dict[kUserEmailIsVerifiedKey]];
  return authorizer;
}

#if !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

+ (GTMAppAuthFetcherAuthorization *)authForGoogleFromKeychainForName:(NSString *)keychainItemName
                                          clientID:(NSString *)clientID
                                      clientSecret:(NSString *)clientSecret {
  Class signInClass = self;
  NSURL *tokenURL = [signInClass googleTokenURL];
  NSString *redirectURI = [signInClass nativeClientRedirectURI];

  GTMAppAuthFetcherAuthorization *auth;
  auth = [self authorizeFromKeychainForName:keychainItemName
                                   tokenURL:tokenURL
                                redirectURI:redirectURI
                                   clientID:clientID
                               clientSecret:clientSecret];
  return auth;
}

#endif // !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

/*! @brief Removes stored tokens, such as when the user signs out.
    @return YES the tokens were removed successfully (or didn't exist).
 */
+ (BOOL)removeAuthFromKeychainForName:(NSString *)keychainItemName {
  return [GTMKeychain removePasswordFromKeychainForName:keychainItemName];
}

/*! @brief Saves the authorization state to the keychain, in a GTMOAuth2 compatible manner.
    @return YES when the state was saved successfully.
 */
+ (BOOL)saveAuthToKeychainForName:(NSString *)keychainItemName
                   authentication:(GTMAppAuthFetcherAuthorization *)auth {
  [self removeAuthFromKeychainForName:keychainItemName];
  NSString *password = [self persistenceResponseStringForAuthorization:auth];

  return [GTMKeychain savePasswordToKeychainForName:keychainItemName password:password];
}

#pragma mark Utility Routines

+ (NSString *)encodedQueryParametersForDictionary:(NSDictionary *)dict {
  // Make a string like "cat=fluffy&dog=spot"
  NSMutableString *result = [NSMutableString string];
  NSArray *sortedKeys =
      [[dict allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
  NSString *joiner = @"";
  for (NSString *key in sortedKeys) {
    NSString *value = [dict objectForKey:key];
    NSString *encodedValue = [self encodedOAuthValueForString:value];
    NSString *encodedKey = [self encodedOAuthValueForString:key];
    [result appendFormat:@"%@%@=%@", joiner, encodedKey, encodedValue];
    joiner = @"&";
  }
  return result;
}

+ (NSString *)encodedOAuthValueForString:(NSString *)originalString {
  // For parameters, we'll explicitly leave spaces unescaped now, and replace
  // them with +'s
  NSString *const kForceEscape = @"!*'();:@&=+$,/?%#[]";

#if (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_9) && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_9) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_7_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0)
  // Builds targeting iOS 7/OS X 10.9 and higher only.
  NSMutableCharacterSet *cs = [[NSCharacterSet URLQueryAllowedCharacterSet] mutableCopy];
  [cs removeCharactersInString:kForceEscape];

  return [originalString stringByAddingPercentEncodingWithAllowedCharacters:cs];
#else
  // Builds targeting iOS 6/OS X 10.8.
  CFStringRef escapedStr = NULL;
  if (originalString) {
    escapedStr = CFURLCreateStringByAddingPercentEscapes(kCFAllocatorDefault,
                                                         (CFStringRef)originalString,
                                                         NULL,
                                                         (CFStringRef)kForceEscape,
                                                         kCFStringEncodingUTF8);
  }

  return (__bridge NSString *)escapedStr;
#endif
}

+ (NSDictionary *)dictionaryWithResponseString:(NSString *)responseStr {
  // Build a dictionary from a response string of the form
  // "cat=fluffy&dog=spot".  Missing or empty values are considered
  // empty strings; keys and values are percent-decoded.
  if (responseStr == nil) return nil;

  NSArray *items = [responseStr componentsSeparatedByString:@"&"];

  NSMutableDictionary *responseDict = [NSMutableDictionary dictionaryWithCapacity:items.count];

  for (NSString *item in items) {
    NSString *key;
    NSString *value = @"";

    NSRange equalsRange = [item rangeOfString:@"="];
    if (equalsRange.location != NSNotFound) {
      // The parameter has at least one '='
      key = [item substringToIndex:equalsRange.location];

      // There are characters after the '='
      if (equalsRange.location + 1 < item.length) {
        value = [item substringFromIndex:(equalsRange.location + 1)];
      }
    } else {
      // The parameter has no '='
      key = item;
    }

    NSString *plainKey = [self unencodedOAuthParameterForString:key];
    NSString *plainValue = [self unencodedOAuthParameterForString:value];

    [responseDict setObject:plainValue forKey:plainKey];
  }

  return responseDict;
}

+ (NSString *)unencodedOAuthParameterForString:(NSString *)str {
#if (!TARGET_OS_IPHONE \
     && defined(MAC_OS_X_VERSION_10_9) \
     && MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_9) \
    || (TARGET_OS_IPHONE \
        && defined(__IPHONE_7_0) \
        && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_7_0)
  // On iOS 7, -stringByRemovingPercentEncoding incorrectly returns nil for an empty string.
  if (str != nil && [str length] == 0) return @"";

  NSString *plainStr = [str stringByRemovingPercentEncoding];
  return plainStr;
#else
  NSString *plainStr = [str stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
  return plainStr;
#endif
}

#if !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

// Endpoint URLs are available at https://accounts.google.com/.well-known/openid-configuration

+ (NSURL *)googleAuthorizationURL {
  NSString *str = @"https://accounts.google.com/o/oauth2/v2/auth";
  return (NSURL *)[NSURL URLWithString:str];
}

+ (NSURL *)googleTokenURL {
  NSString *str = @"https://www.googleapis.com/oauth2/v4/token";
  return (NSURL *)[NSURL URLWithString:str];
}

+ (NSURL *)googleRevocationURL {
  NSString *urlStr = @"https://accounts.google.com/o/oauth2/revoke";
  return (NSURL *)[NSURL URLWithString:urlStr];
}

+ (NSURL *)googleUserInfoURL {
  NSString *urlStr = @"https://www.googleapis.com/oauth2/v3/userinfo";
  return (NSURL *)[NSURL URLWithString:urlStr];
}

+ (NSString *)nativeClientRedirectURI {
  return kOOBString;
}

#endif // !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

@end
