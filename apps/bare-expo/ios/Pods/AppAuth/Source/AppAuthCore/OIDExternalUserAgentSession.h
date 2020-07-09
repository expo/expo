/*! @file OIDExternalUserAgentSession.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 The AppAuth Authors. All Rights Reserved.
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

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents an in-flight external user-agent session.
 */
@protocol OIDExternalUserAgentSession <NSObject>

/*! @brief Cancels the code flow session, invoking the request's callback with a cancelled error.
    @remarks Has no effect if called more than once, or after a
        @c OIDExternalUserAgentSession.resumeExternalUserAgentFlowWithURL: message was received.
        Will cause an error with code: @c ::OIDErrorCodeProgramCanceledAuthorizationFlow to be
        passed to the @c callback block passed to
        @c OIDAuthorizationService.presentAuthorizationRequest:presentingViewController:callback:
 */
- (void)cancel;

/*! @brief Cancels the code flow session, invoking the request's callback with a cancelled error.
    @remarks Has no effect if called more than once, or after a
        @c OIDExternalUserAgentSession.resumeExternalUserAgentFlowWithURL: message was received.
        Will cause an error with code: @c ::OIDErrorCodeProgramCanceledAuthorizationFlow to be
        passed to the @c callback block passed to
        @c OIDAuthorizationService.presentAuthorizationRequest:presentingViewController:callback:
    @param completion The block to be called when the cancel operation ends
 */
- (void)cancelWithCompletion:(nullable void (^)(void))completion;

/*! @brief Clients should call this method with the result of the external user-agent code flow if
        it becomes available.
    @param URL The redirect URL invoked by the server.
    @discussion When the URL represented a valid response, implementations should clean up any
        left-over UI state from the request, for example by closing the
        \SFSafariViewController or loopback HTTP listener if those were used. The completion block
        of the pending request should then be invoked.
    @remarks Has no effect if called more than once, or after a @c cancel message was received.
    @return YES if the passed URL matches the expected redirect URL and was consumed, NO otherwise.
 */
- (BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)URL;

/*! @brief @c OIDExternalUserAgent or clients should call this method when the
        external user-agent flow failed with a non-OAuth error.
    @param error The error that is the reason for the failure of this external flow.
    @remarks Has no effect if called more than once, or after a @c cancel message was received.
 */
- (void)failExternalUserAgentFlowWithError:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
