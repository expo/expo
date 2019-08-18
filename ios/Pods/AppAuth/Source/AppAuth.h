/*! @file AppAuth.h
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

#import "OIDAuthState.h"
#import "OIDAuthStateChangeDelegate.h"
#import "OIDAuthStateErrorDelegate.h"
#import "OIDAuthorizationFlowSession.h"
#import "OIDAuthorizationRequest.h"
#import "OIDAuthorizationResponse.h"
#import "OIDAuthorizationService.h"
#import "OIDError.h"
#import "OIDErrorUtilities.h"
#import "OIDExternalUserAgent.h"
#import "OIDExternalUserAgentRequest.h"
#import "OIDExternalUserAgentSession.h"
#import "OIDGrantTypes.h"
#import "OIDIDToken.h"
#import "OIDRegistrationRequest.h"
#import "OIDRegistrationResponse.h"
#import "OIDResponseTypes.h"
#import "OIDScopes.h"
#import "OIDScopeUtilities.h"
#import "OIDServiceConfiguration.h"
#import "OIDServiceDiscovery.h"
#import "OIDTokenRequest.h"
#import "OIDTokenResponse.h"
#import "OIDTokenUtilities.h"
#import "OIDURLSessionProvider.h"

#if TARGET_OS_TV
#elif TARGET_OS_WATCH
#elif TARGET_OS_IOS
#import "OIDAuthState+IOS.h"
#import "OIDAuthorizationService+IOS.h"
#import "OIDExternalUserAgentIOS.h"
#import "OIDExternalUserAgentIOSCustomBrowser.h"
#elif TARGET_OS_MAC
#import "OIDAuthState+Mac.h"
#import "OIDAuthorizationService+Mac.h"
#import "OIDExternalUserAgentMac.h"
#import "OIDRedirectHTTPHandler.h"
#else
#error "Platform Undefined"
#endif


/*! @mainpage AppAuth for iOS and macOS

    @section introduction Introduction

    AppAuth for iOS and macOS is a client SDK for communicating with [OAuth 2.0]
    (https://tools.ietf.org/html/rfc6749) and [OpenID Connect]
    (http://openid.net/specs/openid-connect-core-1_0.html) providers. It strives to
    directly map the requests and responses of those specifications, while following
    the idiomatic style of the implementation language. In addition to mapping the
    raw protocol flows, convenience methods are available to assist with common
    tasks like performing an action with fresh tokens.

    It follows the best practices set out in 
    [RFC 8252 - OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252)
    including using `SFAuthenticationSession` and `SFSafariViewController` on iOS
    for the auth request. `UIWebView` and `WKWebView` are explicitly *not*
    supported due to the security and usability reasons explained in
    [Section 8.12 of RFC 8252](https://tools.ietf.org/html/rfc8252#section-8.12).

    It also supports the [PKCE](https://tools.ietf.org/html/rfc7636) extension to
    OAuth which was created to secure authorization codes in public clients when
    custom URI scheme redirects are used. The library is friendly to other
    extensions (standard or otherwise) with the ability to handle additional params
    in all protocol requests and responses.

    <b>Homepage</b>: http://openid.github.io/AppAuth-iOS/ <br>
    <b>API Documentation</b>: http://openid.github.io/AppAuth-iOS/docs/latest <br>
    <b>Git Repository</b>: https://github.com/openid/AppAuth-iOS <br>

 */
