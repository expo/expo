/*! @file OIDErrorUtilities.m
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

#import "OIDErrorUtilities.h"

@implementation OIDErrorUtilities

+ (NSError *)errorWithCode:(OIDErrorCode)code
           underlyingError:(NSError *)underlyingError
               description:(NSString *)description {
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  if (underlyingError) {
    userInfo[NSUnderlyingErrorKey] = underlyingError;
  }
  if (description) {
    userInfo[NSLocalizedDescriptionKey] = description;
  }
  // TODO: Populate localized description based on code.
  NSError *error = [NSError errorWithDomain:OIDGeneralErrorDomain
                                       code:code
                                   userInfo:userInfo];
  return error;
}

+ (BOOL)isOAuthErrorDomain:(NSString *)errorDomain {
  return errorDomain == OIDOAuthRegistrationErrorDomain
      || errorDomain == OIDOAuthAuthorizationErrorDomain
      || errorDomain == OIDOAuthTokenErrorDomain;
}

+ (NSError *)resourceServerAuthorizationErrorWithCode:(NSInteger)code
      errorResponse:(nullable NSDictionary *)errorResponse
    underlyingError:(nullable NSError *)underlyingError {
  // builds the userInfo dictionary with the full OAuth response and other information
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  if (errorResponse) {
    userInfo[OIDOAuthErrorResponseErrorKey] = errorResponse;
  }
  if (underlyingError) {
    userInfo[NSUnderlyingErrorKey] = underlyingError;
  }
  NSError *error = [NSError errorWithDomain:OIDResourceServerAuthorizationErrorDomain
                                       code:code
                                   userInfo:userInfo];
  return error;
}

+ (NSError *)OAuthErrorWithDomain:(NSString *)oAuthErrorDomain
                    OAuthResponse:(NSDictionary *)errorResponse
                  underlyingError:(NSError *)underlyingError {
  // not a valid OAuth error
  if (![self isOAuthErrorDomain:oAuthErrorDomain]
      || !errorResponse
      || !errorResponse[OIDOAuthErrorFieldError]
      || ![errorResponse[OIDOAuthErrorFieldError] isKindOfClass:[NSString class]]) {
    return [[self class] errorWithCode:OIDErrorCodeNetworkError
                       underlyingError:underlyingError
                           description:underlyingError.localizedDescription];
  }

  // builds the userInfo dictionary with the full OAuth response and other information
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  userInfo[OIDOAuthErrorResponseErrorKey] = errorResponse;
  if (underlyingError) {
    userInfo[NSUnderlyingErrorKey] = underlyingError;
  }

  NSString *oauthErrorCodeString = errorResponse[OIDOAuthErrorFieldError];
  NSString *oauthErrorMessage = nil;
  if ([errorResponse[OIDOAuthErrorFieldErrorDescription] isKindOfClass:[NSString class]]) {
    oauthErrorMessage = errorResponse[OIDOAuthErrorFieldErrorDescription];
  } else {
    oauthErrorMessage = [errorResponse[OIDOAuthErrorFieldErrorDescription] description];
  }
  NSString *oauthErrorURI = nil;
  if ([errorResponse[OIDOAuthErrorFieldErrorURI] isKindOfClass:[NSString class]]) {
    oauthErrorURI = errorResponse[OIDOAuthErrorFieldErrorURI];
  } else {
    oauthErrorURI = [errorResponse[OIDOAuthErrorFieldErrorURI] description];
  }

  // builds the error description, using the information supplied by the server if possible
  NSMutableString *description = [NSMutableString string];
  [description appendString:oauthErrorCodeString];
  if (oauthErrorMessage) {
    [description appendString:@": "];
    [description appendString:oauthErrorMessage];
  }
  if (oauthErrorURI) {
    if ([description length] > 0) {
      [description appendString:@" - "];
    }
    [description appendString:oauthErrorURI];
  }
  if ([description length] == 0) {
    // backup description
    [description appendFormat:@"OAuth error: %@ - https://tools.ietf.org/html/rfc6749#section-5.2",
                              oauthErrorCodeString];
  }
  userInfo[NSLocalizedDescriptionKey] = description;

  // looks up the error code based on the "error" response param
  OIDErrorCodeOAuth code = [[self class] OAuthErrorCodeFromString:oauthErrorCodeString];

  NSError *error = [NSError errorWithDomain:oAuthErrorDomain
                                       code:code
                                   userInfo:userInfo];
  return error;
}

+ (NSError *)HTTPErrorWithHTTPResponse:(NSHTTPURLResponse *)HTTPURLResponse
                                  data:(nullable NSData *)data {
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  if (data) {
    NSString *serverResponse =
        [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (serverResponse) {
      userInfo[NSLocalizedDescriptionKey] = serverResponse;
    }
  }
  NSError *serverError =
      [NSError errorWithDomain:OIDHTTPErrorDomain
                          code:HTTPURLResponse.statusCode
                      userInfo:userInfo];
  return serverError;
}

+ (OIDErrorCodeOAuth)OAuthErrorCodeFromString:(NSString *)errorCode {
  NSDictionary *errorCodes = @{
      @"invalid_request": @(OIDErrorCodeOAuthInvalidRequest),
      @"unauthorized_client": @(OIDErrorCodeOAuthUnauthorizedClient),
      @"access_denied": @(OIDErrorCodeOAuthAccessDenied),
      @"unsupported_response_type": @(OIDErrorCodeOAuthUnsupportedResponseType),
      @"invalid_scope": @(OIDErrorCodeOAuthInvalidScope),
      @"server_error": @(OIDErrorCodeOAuthServerError),
      @"temporarily_unavailable": @(OIDErrorCodeOAuthTemporarilyUnavailable),
      @"invalid_client": @(OIDErrorCodeOAuthInvalidClient),
      @"invalid_grant": @(OIDErrorCodeOAuthInvalidGrant),
      @"unsupported_grant_type": @(OIDErrorCodeOAuthUnsupportedGrantType),
      };
  NSNumber *code = errorCodes[errorCode];
  if (code) {
    return [code integerValue];
  } else {
    return OIDErrorCodeOAuthOther;
  }
}

+ (void)raiseException:(NSString *)name {
  [[self class] raiseException:name message:name];
}

+ (void)raiseException:(NSString *)name message:(NSString *)message {
  [NSException raise:name format:@"%@", message];
}

@end
