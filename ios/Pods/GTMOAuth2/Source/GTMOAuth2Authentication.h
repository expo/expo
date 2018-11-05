/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if GTM_INCLUDE_OAUTH2 || !GDATA_REQUIRE_SERVICE_INCLUDES

// This class implements the OAuth 2 protocol for authorizing requests.
// http://tools.ietf.org/html/draft-ietf-oauth-v2

#import <Foundation/Foundation.h>

#if (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_11) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_11) \
  || (TARGET_OS_IPHONE && defined(__IPHONE_9_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0)
  #ifndef GTM_USE_SESSION_FETCHER
    #define GTM_USE_SESSION_FETCHER 1
  #endif

  #define GTMOAUTH2AUTHENTICATION_DEPRECATE_OLD_ENUMS 1
#endif

#ifndef GTM_OAUTH2_USE_FRAMEWORK_IMPORTS
#define GTM_OAUTH2_USE_FRAMEWORK_IMPORTS 0
#endif

#ifndef GTM_OAUTH2_USE_PLATFORM_FRAMEWORK
#define GTM_OAUTH2_USE_PLATFORM_FRAMEWORK 0
#endif

#if GTM_USE_SESSION_FETCHER
  #if GTM_OAUTH2_USE_FRAMEWORK_IMPORTS
    #if GTM_OAUTH2_USE_PLATFORM_FRAMEWORK
      // App project file use.
      #if TARGET_OS_IPHONE
        #import <GTMSessionFetcherIOS/GTMSessionFetcher.h>
      #else
        #import <GTMSessionFetcherOSX/GTMSessionFetcher.h>
      #endif  // TARGET_OS_IPHONE
    #else
      // Cocoapod use.
      #import <GTMSessionFetcher/GTMSessionFetcher.h>
    #endif  // GTM_OAUTH2_USE_PLATFORM_FRAMEWORK
  #else
    #import "GTMSessionFetcher.h"
  #endif  // GTM_OAUTH2_USE_FRAMEWORK_IMPORTS
#else
  #if GTM_OAUTH2_USE_FRAMEWORK_IMPORTS
    #error GTMHTTPFetcher lacks a framework build
  #else
    #import "GTMHTTPFetcher.h"
  #endif  // GTM_OAUTH2_USE_FRAMEWORK_IMPORTS
#endif  // GTM_USE_SESSION_FETCHER

#define GTMOAuth2Fetcher GTMBridgeFetcher
#define GTMOAuth2FetcherService GTMBridgeFetcherService
#define GTMOAuth2FetcherServiceProtocol GTMBridgeFetcherServiceProtocol
#define GTMOAuth2AssertValidSelector GTMBridgeAssertValidSelector
#define GTMOAuth2CookieStorage GTMBridgeCookieStorage
#define kGTMOAuth2FetcherStatusDomain kGTMBridgeFetcherStatusDomain
#define kGTMOAuth2StatusBadRequest kGTMBridgeFetcherStatusBadRequest


// Until all OAuth 2 providers are up to the same spec, we'll provide a crude
// way here to override the "Bearer" string in the Authorization header
#ifndef GTM_OAUTH2_BEARER
#define GTM_OAUTH2_BEARER "Bearer"
#endif

#ifdef __cplusplus
extern "C" {
#endif

// Service provider name allows stored authorization to be associated with
// the authorizing service
extern NSString *const kGTMOAuth2ServiceProviderGoogle;

//
// GTMOAuth2SignIn constants, included here for use by clients
//
extern NSString *const kGTMOAuth2ErrorDomain;

// Error userInfo keys
extern NSString *const kGTMOAuth2ErrorMessageKey;
extern NSString *const kGTMOAuth2ErrorRequestKey;
extern NSString *const kGTMOAuth2ErrorJSONKey;

typedef NS_ENUM(NSInteger, GTMOAuth2Error) {
  // Error code indicating that the window was prematurely closed
  GTMOAuth2ErrorWindowClosed          = -1000,
  GTMOAuth2ErrorAuthorizationFailed   = -1001,
  GTMOAuth2ErrorTokenExpired          = -1002,
  GTMOAuth2ErrorTokenUnavailable      = -1003,
  GTMOAuth2ErrorUnauthorizableRequest = -1004
};

#if !GTMOAUTH2AUTHENTICATION_DEPRECATE_OLD_ENUMS
#define kGTMOAuth2ErrorWindowClosed          GTMOAuth2ErrorWindowClosed
#define kGTMOAuth2ErrorAuthorizationFailed   GTMOAuth2ErrorAuthorizationFailed
#define kGTMOAuth2ErrorTokenExpired          GTMOAuth2ErrorTokenExpired
#define kGTMOAuth2ErrorTokenUnavailable      GTMOAuth2ErrorTokenUnavailable
#define kGTMOAuth2ErrorUnauthorizableRequest GTMOAuth2ErrorUnauthorizableRequest
#endif

// Notifications for token fetches
extern NSString *const kGTMOAuth2FetchStarted;
extern NSString *const kGTMOAuth2FetchStopped;

extern NSString *const kGTMOAuth2FetcherKey;
extern NSString *const kGTMOAuth2FetchTypeKey;
extern NSString *const kGTMOAuth2FetchTypeToken;
extern NSString *const kGTMOAuth2FetchTypeRefresh;
extern NSString *const kGTMOAuth2FetchTypeAssertion;
extern NSString *const kGTMOAuth2FetchTypeUserInfo;

// Token-issuance errors
extern NSString *const kGTMOAuth2ErrorKey;
extern NSString *const kGTMOAuth2ErrorObjectKey;

extern NSString *const kGTMOAuth2ErrorInvalidRequest;
extern NSString *const kGTMOAuth2ErrorInvalidClient;
extern NSString *const kGTMOAuth2ErrorInvalidGrant;
extern NSString *const kGTMOAuth2ErrorUnauthorizedClient;
extern NSString *const kGTMOAuth2ErrorUnsupportedGrantType;
extern NSString *const kGTMOAuth2ErrorInvalidScope;

// Notification that sign-in has completed, and token fetches will begin (useful
// for displaying interstitial messages after the window has closed)
extern NSString *const kGTMOAuth2UserSignedIn;

// Notification for token changes
extern NSString *const kGTMOAuth2AccessTokenRefreshed;
extern NSString *const kGTMOAuth2RefreshTokenChanged;
extern NSString *const kGTMOAuth2AccessTokenRefreshFailed;

// Notification for WebView loading
extern NSString *const kGTMOAuth2WebViewStartedLoading;
extern NSString *const kGTMOAuth2WebViewStoppedLoading;
extern NSString *const kGTMOAuth2WebViewKey;
extern NSString *const kGTMOAuth2WebViewStopKindKey;
extern NSString *const kGTMOAuth2WebViewFinished;
extern NSString *const kGTMOAuth2WebViewFailed;
extern NSString *const kGTMOAuth2WebViewCancelled;

// Notification for network loss during html sign-in display
extern NSString *const kGTMOAuth2NetworkLost;
extern NSString *const kGTMOAuth2NetworkFound;

#ifdef __cplusplus
}
#endif

@interface GTMOAuth2Authentication : NSObject <GTMFetcherAuthorizationProtocol>  {
 @private
  NSString *clientID_;
  NSString *clientSecret_;
  NSString *redirectURI_;
  NSMutableDictionary *parameters_;

  // authorization parameters
  NSURL *tokenURL_;
  NSDate *expirationDate_;

  NSString *authorizationTokenKey_;

  NSDictionary *additionalTokenRequestParameters_;
  NSDictionary *additionalGrantTypeRequestParameters_;

  // queue of requests for authorization waiting for a valid access token
  GTMOAuth2Fetcher *refreshFetcher_;
  NSMutableArray *authorizationQueue_;

  id <GTMOAuth2FetcherServiceProtocol> fetcherService_; // WEAK

  BOOL shouldAuthorizeAllRequests_;

  // arbitrary data retained for the user
  id userData_;
  NSMutableDictionary *properties_;
}

// OAuth2 standard protocol parameters
//
// These should be the plain strings; any needed escaping will be provided by
// the library.

// Request properties
@property (atomic, copy) NSString *clientID;
@property (atomic, copy) NSString *clientSecret;
@property (atomic, copy) NSString *redirectURI;
@property (atomic, retain) NSString *scope;
@property (atomic, retain) NSString *tokenType;
@property (atomic, retain) NSString *assertion;
@property (atomic, retain) NSString *refreshScope;

// Apps may optionally add parameters here to be provided to the token
// endpoint on token requests and refreshes.
@property (atomic, retain) NSDictionary *additionalTokenRequestParameters;

// Apps may optionally add parameters here to be provided to the token
// endpoint on specific token requests and refreshes, keyed by the grant_type.
// For example, if a different "type" parameter is required for obtaining
// the auth code and on refresh, this might be:
//
//  viewController.authentication.additionalGrantTypeRequestParameters = @{
//    @"authorization_code" : @{ @"type" : @"code" },
//    @"refresh_token" : @{ @"type" : @"refresh" }
//  };
@property (atomic, retain) NSDictionary *additionalGrantTypeRequestParameters;

// Response properties

// Dictionary of response and other properties; not KVO compliant
@property (atomic, readonly) NSDictionary *parameters;

@property (atomic, retain) NSString *accessToken;
@property (atomic, retain) NSString *refreshToken;
@property (atomic, retain) NSNumber *expiresIn;
@property (atomic, retain) NSString *code;
@property (atomic, retain) NSString *errorString;

// URL for obtaining access tokens
@property (atomic, copy) NSURL *tokenURL;

// Calculated expiration date (expiresIn seconds added to the
// time the access token was received.)
@property (atomic, copy) NSDate *expirationDate;

// Service identifier, like "Google"; not used for authentication
//
// The provider name is just for allowing stored authorization to be associated
// with the authorizing service.
@property (atomic, copy) NSString *serviceProvider;

// User ID; not used for authentication
@property (retain) NSString *userID;

// User email and verified status; not used for authentication
//
// The verified string can be checked with -boolValue. If the result is false,
// then the email address is listed with the account on the server, but the
// address has not been confirmed as belonging to the owner of the account.
@property (atomic, retain) NSString *userEmail;
@property (atomic, retain) NSString *userEmailIsVerified;

// Property indicating if this auth has a refresh or access token so is suitable
// for authorizing a request. This does not guarantee that the token is valid.
@property (atomic, readonly) BOOL canAuthorize;

// Property indicating if this object will authorize plain http request
// (as well as any non-https requests.) Default is NO, only requests with the
// scheme https are authorized, since security may be compromised if tokens
// are sent over the wire using an unencrypted protocol like http.
@property (atomic, assign) BOOL shouldAuthorizeAllRequests;

// userData is retained for the convenience of the caller
@property (atomic, retain) id userData;

// Stored property values are retained for the convenience of the caller
@property (atomic, retain) NSDictionary *properties;

// Property for the optional fetcher service instance to be used to create
// fetchers
//
// Fetcher service objects retain authorizations, so this is weak to avoid
// circular retains.
@property (atomic, assign) id <GTMOAuth2FetcherServiceProtocol> fetcherService; // WEAK

// Key for the response parameter used for the authorization header; by default,
// "access_token" is used, but some servers may expect alternatives, like
// "id_token".
@property (atomic, copy) NSString *authorizationTokenKey;

// Convenience method for creating an authentication object
+ (id)authenticationWithServiceProvider:(NSString *)serviceProvider
                               tokenURL:(NSURL *)tokenURL
                            redirectURI:(NSString *)redirectURI
                               clientID:(NSString *)clientID
                           clientSecret:(NSString *)clientSecret;

// Clear out any authentication values, prepare for a new request fetch
- (void)reset;

// Main authorization entry points
//
// These will refresh the access token, if necessary, add the access token to
// the request, then invoke the callback.
//
// The request argument may be nil to just force a refresh of the access token,
// if needed.
//
// NOTE: To avoid accidental leaks of bearer tokens, the request must
// be for a URL with the scheme https unless the shouldAuthorizeAllRequests
// property is set.

// The finish selector should have a signature matching
//   - (void)authentication:(GTMOAuth2Authentication *)auth
//                  request:(NSMutableURLRequest *)request
//        finishedWithError:(NSError *)error;

- (void)authorizeRequest:(NSMutableURLRequest *)request
                delegate:(id)delegate
       didFinishSelector:(SEL)sel;

#if NS_BLOCKS_AVAILABLE
- (void)authorizeRequest:(NSMutableURLRequest *)request
       completionHandler:(void (^)(NSError *error))handler;
#endif

// Synchronous entry point; authorizing this way cannot refresh an expired
// access token
- (BOOL)authorizeRequest:(NSMutableURLRequest *)request;

// If the authentication is waiting for a refresh to complete, spin the run
// loop, discarding events, until the fetch has completed
//
// This is only for use in testing or in tools without a user interface.
- (void)waitForCompletionWithTimeout:(NSTimeInterval)timeoutInSeconds;


//////////////////////////////////////////////////////////////////////////////
//
// Internal properties and methods for use by GTMOAuth2SignIn
//

// Pending fetcher to get a new access token, if any
@property (atomic, retain) GTMOAuth2Fetcher *refreshFetcher;

// Check if a request is queued up to be authorized
- (BOOL)isAuthorizingRequest:(NSURLRequest *)request;

// Check if a request appears to be authorized
- (BOOL)isAuthorizedRequest:(NSURLRequest *)request;

// Stop any pending refresh fetch. This will also cancel the authorization
// for all fetch requests pending authorization.
- (void)stopAuthorization;

// Prevents authorization callback for a given request.
- (void)stopAuthorizationForRequest:(NSURLRequest *)request;

// OAuth fetch user-agent header value
- (NSString *)userAgent;

// Parse and set token and token secret from response data
- (void)setKeysForResponseString:(NSString *)str;
- (void)setKeysForResponseDictionary:(NSDictionary *)dict;

// Persistent token string for keychain storage
//
// We'll use the format "refresh_token=foo&serviceProvider=bar" so we can
// easily alter what portions of the auth data are stored
//
// Use these methods for serialization
- (NSString *)persistenceResponseString;
- (void)setKeysForPersistenceResponseString:(NSString *)str;

// method to begin fetching an access token, used by the sign-in object
- (GTMOAuth2Fetcher *)beginTokenFetchWithDelegate:(id)delegate
                              didFinishSelector:(SEL)finishedSel;

// Entry point to post a notification about a fetcher currently used for
// obtaining or refreshing a token; the sign-in object will also use this
// to indicate when the user's email address is being fetched.
//
// Fetch type constants are above under "notifications for token fetches"
- (void)notifyFetchIsRunning:(BOOL)isStarting
                     fetcher:(GTMOAuth2Fetcher *)fetcher
                        type:(NSString *)fetchType;

// Arbitrary key-value properties retained for the user
- (void)setProperty:(id)obj forKey:(NSString *)key;
- (id)propertyForKey:(NSString *)key;

//
// Utilities
//

+ (NSString *)encodedOAuthValueForString:(NSString *)str;

+ (NSString *)encodedQueryParametersForDictionary:(NSDictionary *)dict;

+ (NSDictionary *)dictionaryWithResponseString:(NSString *)responseStr;

+ (NSDictionary *)dictionaryWithJSONData:(NSData *)data;

+ (NSString *)scopeWithStrings:(NSString *)firstStr, ... NS_REQUIRES_NIL_TERMINATION;
@end

#endif // GTM_INCLUDE_OAUTH2 || !GDATA_REQUIRE_SERVICE_INCLUDES
