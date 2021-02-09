/*! @file GTMAppAuthFetcherAuthorization.h
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

#if SWIFT_PACKAGE || GTMAPPAUTH_USE_MODULAR_IMPORT
@import GTMSessionFetcherCore;
#elif GTMAPPAUTH_USER_IMPORTS
#import "GTMSessionFetcher.h"
#else
#import <GTMSessionFetcher/GTMSessionFetcher.h>
#endif

@class OIDAuthState;
@class OIDServiceConfiguration;

NS_ASSUME_NONNULL_BEGIN

/*! @brief The userInfo key for the @c NSURLRequest.
 */
extern NSString *const GTMAppAuthFetcherAuthorizationErrorRequestKey;

/*! @brief The error domain for errors specific to the session fetcher authorization.
 */
extern NSString *const GTMAppAuthFetcherAuthorizationErrorDomain;

/*! @brief Enum of all possible error codes in the @c ::GTMAppAuthFetcherAuthorizationErrorDomain
        domain.
    @discussion Note that these are GTMAppAuth-specific errors. When AppAuth errors are encountered,
        those are returned instead.
 */
typedef NS_ENUM(NSInteger, GTMAppAuthFetcherAuthorizationError) {
  GTMAppAuthFetcherAuthorizationErrorUnauthorizableRequest = -1004
};

typedef void (^GTMAppAuthFetcherAuthorizationCompletion)(NSError *_Nullable error);

@class GTMAppAuthFetcherAuthorization;

/*! @protocol GTMAppAuthFetcherAuthorizationTokenRefreshDelegate
    @brief Delegate of the GTMAppAuthFetcherAuthorization used to supply additional parameters on
        token refresh.
 */
@protocol GTMAppAuthFetcherAuthorizationTokenRefreshDelegate <NSObject>

/*! @brief Called before a token refresh request is performed.
    @param authorization The @c GTMFetcherAuthorization performing the token refresh.
    @return A dictionary of parameters to be added to the token refresh request.
 */
- (nullable NSDictionary<NSString *, NSString *> *)additionalRefreshParameters:
    (GTMAppAuthFetcherAuthorization *)authorization;

@end

/*! @brief An implementation of the @c GTMFetcherAuthorizationProtocol protocol for the AppAuth
        library.
    @discussion Enables you to use AppAuth with the GTM Session Fetcher library.
 */
@interface GTMAppAuthFetcherAuthorization : NSObject <GTMFetcherAuthorizationProtocol,
                                                      NSSecureCoding>

/*! @brief The AppAuth authentication state.
 */
@property(nonatomic, readonly) OIDAuthState *authState;

/*! @brief Service identifier, for example "Google"; not used for authentication.
    @discussion The provider name is just for allowing stored authorization to be associated
        with the authorizing service.
 */
@property(nullable, nonatomic, readonly) NSString *serviceProvider;

/*! @brief User ID from the ID Token.
 *  @discussion Note: Never send this value to your backend as an authentication token, rather send
 *      an ID Token and validate it.
 */
@property(nullable, nonatomic, readonly) NSString *userID;

/*! @brief Email verified status; not used for authentication.
    @discussion The verified string can be checked with -boolValue. If the result is false, then
        the email address is listed with the account on the server, but the address has not been
        confirmed as belonging to the owner of the account.
 */
@property(nullable, nonatomic, readonly) NSString *userEmailIsVerified;

@property(nullable, nonatomic, weak) id<GTMAppAuthFetcherAuthorizationTokenRefreshDelegate>
    tokenRefreshDelegate;

/*! @brief Creates a new @c GTMAppAuthFetcherAuthorization using the given @c OIDAuthState from
        AppAuth.
    @param authState The authorization state.
 */
- (instancetype)initWithAuthState:(OIDAuthState *)authState;

/*! @brief Creates a new @c GTMAppAuthFetcherAuthorization using the given @c OIDAuthState from
        AppAuth.
    @param authState The authorization state.
    @param serviceProvider An optional string to describe the service.
    @param userID An optional string of the user ID.
    @param userEmail An optional string of the user's email address.
    @param userEmailIsVerified An optional string representation of a boolean to indicate that the
        email address has been verified. Pass @"true" for @c YES, or @"false" for @c NO.
    @discussion Designated initializer.
 */
- (instancetype)initWithAuthState:(OIDAuthState *)authState
                  serviceProvider:(nullable NSString *)serviceProvider
                           userID:(nullable NSString *)userID
                        userEmail:(nullable NSString *)userEmail
              userEmailIsVerified:(nullable NSString *)userEmailIsVerified
    NS_DESIGNATED_INITIALIZER;

#if !GTM_APPAUTH_SKIP_GOOGLE_SUPPORT
/*! @brief Convenience method to return an @c OIDServiceConfiguration for Google.
    @return A @c OIDServiceConfiguration object setup with Google OAuth endpoints.
 */
+ (OIDServiceConfiguration *)configurationForGoogle;
#endif // !GTM_APPAUTH_SKIP_GOOGLE_SUPPORT

/*! @brief Adds an authorization header to the given request, using the authorization state.
        Refreshes the access token if needed.
    @param request The request to authorize.
    @param handler The block that is called after authorizing the request is attempted. If @c error
        is non-nil, the authorization failed. Errors in the domain @c ::OIDOAuthTokenErrorDomain
        indicate that the authorization itself is invalid, and will need to be re-obtained from the
        user. Errors in the @c GTMAppAuthFetcherAuthorizationErrorDomain indicate another
        unrecoverable errors. Errors in other domains may indicate a transitive error condition such
        as a network error, and typically you do not need to reauthenticate the user on such errors.
    @discussion The completion handler is scheduled on the main thread, unless the @c callbackQueue
        property is set on the @c fetcherService in which case the handler is scheduled on that
        queue.
 */
- (void)authorizeRequest:(nullable NSMutableURLRequest *)request
       completionHandler:(GTMAppAuthFetcherAuthorizationCompletion)handler;

/*! @brief Returns YES if the authorization state is currently valid.
    @discussion Note that this doesn't guarantee that a request will get a valid authorization, as
       the authorization state could become invalid on on the next token refresh.
 */
- (BOOL)canAuthorize;

@end

NS_ASSUME_NONNULL_END
