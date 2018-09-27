/*! @file OIDError.m
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

#import "OIDError.h"

NSString *const OIDGeneralErrorDomain = @"org.openid.appauth.general";

NSString *const OIDOAuthTokenErrorDomain = @"org.openid.appauth.oauth_token";

NSString *const OIDOAuthAuthorizationErrorDomain = @"org.openid.appauth.oauth_authorization";

NSString *const OIDOAuthRegistrationErrorDomain = @"org.openid.appauth.oauth_registration";

NSString *const OIDResourceServerAuthorizationErrorDomain = @"org.openid.appauth.resourceserver";

NSString *const OIDHTTPErrorDomain = @"org.openid.appauth.remote-http";

NSString *const OIDOAuthExceptionInvalidAuthorizationFlow = @"An OAuth redirect was sent to a "
    "OIDAuthorizationFlowSession after it already completed.";

NSString *const OIDOAuthExceptionInvalidTokenRequestNullRedirectURL = @"A OIDTokenRequest was "
    "created with a grant_type that requires a redirectURL, but a null redirectURL was given";

NSString *const OIDOAuthErrorResponseErrorKey = @"OIDOAuthErrorResponseErrorKey";

NSString *const OIDOAuthErrorFieldError = @"error";

NSString *const OIDOAuthErrorFieldErrorDescription = @"error_description";

NSString *const OIDOAuthErrorFieldErrorURI = @"error_uri";
