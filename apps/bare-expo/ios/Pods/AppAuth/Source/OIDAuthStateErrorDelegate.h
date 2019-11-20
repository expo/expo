/*! @file OIDAuthStateErrorDelegate.h
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

@class OIDAuthState;

NS_ASSUME_NONNULL_BEGIN

/*! @protocol OIDAuthStateErrorDelegate
    @brief Delegate of the OIDAuthState used to monitor errors.
 */
@protocol OIDAuthStateErrorDelegate <NSObject>

/*! @brief Called when an authentication occurs, which indicates the auth session is invalid.
    @param state The @c OIDAuthState on which the error occurred.
    @param error The authorization error.
    @discussion This is a hard error (not a transient network issue) that indicates a problem with
        the authorization. You should stop using the @c OIDAuthState when such an error is
        encountered. If the \NSError_code is @c ::OIDErrorCodeOAuthInvalidGrant then
        the session may be recoverable with user interaction (i.e. re-authentication). In all cases
        you should consider the user unauthorized, and remove locally cached resources that require
        that authorization.  @c OIDAuthState will call this method automatically if it encounters
        an OAuth error (that is, an HTTP 400 response with a valid OAuth error response) during
        authorization or token refresh (such as performed automatically when using
        @c OIDAuthState.performActionWithFreshTokens:). You can signal authorization errors with
        @c OIDAuthState.updateWithAuthorizationError:.
    @see https://tools.ietf.org/html/rfc6749#section-5.2
 */
- (void)authState:(OIDAuthState *)state didEncounterAuthorizationError:(NSError *)error;

@optional

/*! @brief Called when a network or other transient error occurs.
    @param state The @c OIDAuthState on which the error occurred.
    @param error The transient error.
    @discussion This is a soft error, typically network related. The @c OIDAuthState is likely
        still valid, and should not be discarded. Retry the request using an incremental backoff
        strategy. This is only called when using the @c OIDAuthState convenience methods such as
        @c OIDAuthState.performActionWithFreshTokens:. If you are refreshing the tokens yourself
        outside of @c OIDAuthState class, it will never be called.
 */
- (void)authState:(OIDAuthState *)state didEncounterTransientError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
