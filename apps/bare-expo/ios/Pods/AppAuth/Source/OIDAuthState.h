/*! @file OIDAuthState.h
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
#import <Foundation/Foundation.h>

@class OIDAuthorizationRequest;
@class OIDAuthorizationResponse;
@class OIDAuthState;
@class OIDRegistrationResponse;
@class OIDTokenResponse;
@class OIDTokenRequest;
@protocol OIDAuthStateChangeDelegate;
@protocol OIDAuthStateErrorDelegate;
@protocol OIDExternalUserAgent;
@protocol OIDExternalUserAgentSession;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents a block used to call an action with a fresh access token.
    @param accessToken A valid access token if available.
    @param idToken A valid ID token if available.
    @param error The error if an error occurred.
 */
typedef void (^OIDAuthStateAction)(NSString *_Nullable accessToken,
                                   NSString *_Nullable idToken,
                                   NSError *_Nullable error);

/*! @brief The method called when the @c
        OIDAuthState.authStateByPresentingAuthorizationRequest:presentingViewController:callback:
        method has completed or failed.
    @param authState The auth state, if the authorization request succeeded.
    @param error The error if an error occurred.
 */
typedef void (^OIDAuthStateAuthorizationCallback)(OIDAuthState *_Nullable authState,
                                                  NSError *_Nullable error);

/*! @brief A convenience class that retains the auth state between @c OIDAuthorizationResponse%s
        and @c OIDTokenResponse%s.
 */
@interface OIDAuthState : NSObject <NSSecureCoding>

/*! @brief The most recent refresh token received from the server.
    @discussion Rather than using this property directly, you should call
        @c OIDAuthState.performActionWithFreshTokens:.
    @remarks refresh_token
    @see https://tools.ietf.org/html/rfc6749#section-5.1
 */
@property(nonatomic, readonly, nullable) NSString *refreshToken;

/*! @brief The scope of the current authorization grant.
    @discussion This represents the latest scope returned by the server and may be a subset of the
        scope that was initially granted.
    @remarks scope
 */
@property(nonatomic, readonly, nullable) NSString *scope;

/*! @brief The most recent authorization response used to update the authorization state. For the
        implicit flow, this will contain the latest access token.
 */
@property(nonatomic, readonly) OIDAuthorizationResponse *lastAuthorizationResponse;

/*! @brief The most recent token response used to update this authorization state. This will
        contain the latest access token.
 */
@property(nonatomic, readonly, nullable) OIDTokenResponse *lastTokenResponse;

/*! @brief The most recent registration response used to update this authorization state. This will
        contain the latest client credentials.
 */
@property(nonatomic, readonly, nullable) OIDRegistrationResponse *lastRegistrationResponse;

/*! @brief The authorization error that invalidated this @c OIDAuthState.
    @discussion The authorization error encountered by @c OIDAuthState or set by the user via
        @c OIDAuthState.updateWithAuthorizationError: that invalidated this @c OIDAuthState.
        Authorization errors from @c OIDAuthState will always have a domain of
        @c ::OIDOAuthAuthorizationErrorDomain or @c ::OIDOAuthTokenErrorDomain. Note: that after
        unarchiving the @c OIDAuthState object, the \NSError_userInfo property of this error will
        be nil.
 */
@property(nonatomic, readonly, nullable) NSError *authorizationError;

/*! @brief Returns YES if the authorization state is not known to be invalid.
    @discussion Returns YES if no OAuth errors have been received, and the last call resulted in a
        successful access token or id token. This does not mean that the access is fresh - just
        that it was valid the last time it was used. Note that network and other transient errors
        do not invalidate the authorized state.  If NO, you should authenticate the user again,
        using a fresh authorization request. Invalid @c OIDAuthState objects may still be useful in
        that case, to hint at the previously authorized user and streamline the re-authentication
        experience.
 */
@property(nonatomic, readonly) BOOL isAuthorized;

/*! @brief The @c OIDAuthStateChangeDelegate delegate.
    @discussion Use the delegate to observe state changes (and update storage) as well as error
        states.
 */
@property(nonatomic, weak, nullable) id<OIDAuthStateChangeDelegate> stateChangeDelegate;

/*! @brief The @c OIDAuthStateErrorDelegate delegate.
    @discussion Use the delegate to observe state changes (and update storage) as well as error
        states.
 */
@property(nonatomic, weak, nullable) id<OIDAuthStateErrorDelegate> errorDelegate;

/*! @brief Convenience method to create a @c OIDAuthState by presenting an authorization request
        and performing the authorization code exchange in the case of code flow requests. For
        the hybrid flow, the caller should validate the id_token and c_hash, then perform the token
        request (@c OIDAuthorizationService.performTokenRequest:callback:)
        and update the OIDAuthState with the results (@c
        OIDAuthState.updateWithTokenResponse:error:).
    @param authorizationRequest The authorization request to present.
    @param externalUserAgent A external user agent that can present an external user-agent request.
    @param callback The method called when the request has completed or failed.
    @return A @c OIDExternalUserAgentSession instance which will terminate when it
        receives a @c OIDExternalUserAgentSession.cancel message, or after processing a
        @c OIDExternalUserAgentSession.resumeExternalUserAgentFlowWithURL: message.
 */
+ (id<OIDExternalUserAgentSession>)
    authStateByPresentingAuthorizationRequest:(OIDAuthorizationRequest *)authorizationRequest
                            externalUserAgent:(id<OIDExternalUserAgent>)externalUserAgent
                                     callback:(OIDAuthStateAuthorizationCallback)callback;

/*! @internal
    @brief Unavailable. Please use @c initWithAuthorizationResponse:.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Creates an auth state from an authorization response.
    @param authorizationResponse The authorization response.
 */
- (instancetype)initWithAuthorizationResponse:(OIDAuthorizationResponse *)authorizationResponse;

/*! @brief Creates an auth state from an authorization and token response.
    @param authorizationResponse The authorization response.
    @param tokenResponse The token response.
 */
- (instancetype)initWithAuthorizationResponse:(OIDAuthorizationResponse *)authorizationResponse
                                tokenResponse:(nullable OIDTokenResponse *)tokenResponse;

/*! @brief Creates an auth state from an registration response.
    @param registrationResponse The registration response.
 */
- (instancetype)initWithRegistrationResponse:(OIDRegistrationResponse *)registrationResponse;

/*! @brief Creates an auth state from an authorization, token and registration response.
    @param authorizationResponse The authorization response.
    @param tokenResponse The token response.
    @param registrationResponse The registration response.
 */
- (instancetype)initWithAuthorizationResponse:
    (nullable OIDAuthorizationResponse *)authorizationResponse
           tokenResponse:(nullable OIDTokenResponse *)tokenResponse
    registrationResponse:(nullable OIDRegistrationResponse *)registrationResponse
    NS_DESIGNATED_INITIALIZER;

/*! @brief Updates the authorization state based on a new authorization response.
    @param authorizationResponse The new authorization response to update the state with.
    @param error Any error encountered when performing the authorization request. Errors in the
        domain @c ::OIDOAuthAuthorizationErrorDomain are reflected in the auth state, other errors
        are assumed to be transient, and ignored.
    @discussion Typically called with the response from an incremental authorization request,
        or if using the implicit flow. Will clear the @c #lastTokenResponse property.
 */
- (void)updateWithAuthorizationResponse:(nullable OIDAuthorizationResponse *)authorizationResponse
                                  error:(nullable NSError *)error;

/*! @brief Updates the authorization state based on a new token response.
    @param tokenResponse The new token response to update the state from.
    @param error Any error encountered when performing the authorization request. Errors in the
        domain @c ::OIDOAuthTokenErrorDomain are reflected in the auth state, other errors
        are assumed to be transient, and ignored.
    @discussion Typically called with the response from an authorization code exchange, or a token
        refresh.
 */
- (void)updateWithTokenResponse:(nullable OIDTokenResponse *)tokenResponse
                          error:(nullable NSError *)error;

/*! @brief Updates the authorization state based on a new registration response.
    @param registrationResponse The new registration response to update the state with.
    @discussion Typically called with the response from a successful client registration
        request. Will reset the auth state.
 */
- (void)updateWithRegistrationResponse:(nullable OIDRegistrationResponse *)registrationResponse;

/*! @brief Updates the authorization state based on an authorization error.
    @param authorizationError The authorization error.
    @discussion Call this method if you receive an authorization error during an API call to
        invalidate the authentication state of this @c OIDAuthState. Don't call with errors
        unrelated to authorization, such as transient network errors.
        The OIDAuthStateErrorDelegate.authState:didEncounterAuthorizationError: method of
        @c #errorDelegate will be called with the error.
        You may optionally use the convenience method
        OIDErrorUtilities.resourceServerAuthorizationErrorWithCode:errorResponse:underlyingError:
        to create \NSError objects for use here.
        The latest error received is stored in @c #authorizationError. Note: that after unarchiving
        this object, the \NSError_userInfo property of this error will be nil.
 */
- (void)updateWithAuthorizationError:(NSError *)authorizationError;

/*! @brief Calls the block with a valid access token (refreshing it first, if needed), or if a
        refresh was needed and failed, with the error that caused it to fail.
    @param action The block to execute with a fresh token. This block will be executed on the main
        thread.
 */
- (void)performActionWithFreshTokens:(OIDAuthStateAction)action;

/*! @brief Calls the block with a valid access token (refreshing it first, if needed), or if a
        refresh was needed and failed, with the error that caused it to fail.
    @param action The block to execute with a fresh token. This block will be executed on the main
        thread.
    @param additionalParameters Additional parameters for the token request if token is
        refreshed.
 */
- (void)performActionWithFreshTokens:(OIDAuthStateAction)action
         additionalRefreshParameters:
    (nullable NSDictionary<NSString *, NSString *> *)additionalParameters;

/*! @brief Calls the block with a valid access token (refreshing it first, if needed), or if a
        refresh was needed and failed, with the error that caused it to fail.
    @param action The block to execute with a fresh token. This block will be executed on the main
        thread.
    @param additionalParameters Additional parameters for the token request if token is
        refreshed.
    @param dispatchQueue The dispatchQueue on which to dispatch the action block.
 */
- (void)performActionWithFreshTokens:(OIDAuthStateAction)action
         additionalRefreshParameters:
    (nullable NSDictionary<NSString *, NSString *> *)additionalParameters
                       dispatchQueue:(dispatch_queue_t)dispatchQueue;

/*! @brief Forces a token refresh the next time @c OIDAuthState.performActionWithFreshTokens: is
        called, even if the current tokens are considered valid.
 */
- (void)setNeedsTokenRefresh;

/*! @brief Creates a token request suitable for refreshing an access token.
    @return A @c OIDTokenRequest suitable for using a refresh token to obtain a new access token.
    @discussion After performing the refresh, call @c OIDAuthState.updateWithTokenResponse:error:
        to update the authorization state based on the response. Rather than doing the token refresh
        yourself, you should use @c OIDAuthState.performActionWithFreshTokens:.
    @see https://tools.ietf.org/html/rfc6749#section-1.5
 */
- (nullable OIDTokenRequest *)tokenRefreshRequest;

/*! @brief Creates a token request suitable for refreshing an access token.
    @param additionalParameters Additional parameters for the token request.
    @return A @c OIDTokenRequest suitable for using a refresh token to obtain a new access token.
    @discussion After performing the refresh, call @c OIDAuthState.updateWithTokenResponse:error:
        to update the authorization state based on the response. Rather than doing the token refresh
        yourself, you should use @c OIDAuthState.performActionWithFreshTokens:.
    @see https://tools.ietf.org/html/rfc6749#section-1.5
 */
- (nullable OIDTokenRequest *)tokenRefreshRequestWithAdditionalParameters:
    (nullable NSDictionary<NSString *, NSString *> *)additionalParameters;

@end

NS_ASSUME_NONNULL_END
