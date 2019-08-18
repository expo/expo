/*! @file OIDAuthorizationRequest.h
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

/*! @brief Represents an in-flight authorization flow session.
    @deprecated Use the more generic OIDExternalUserAgentSession instead.
 */
__attribute__((deprecated("Use the more generic OIDExternalUserAgentSession instead.")))
@protocol OIDAuthorizationFlowSession <NSObject>

/*! @brief Clients should call this method with the result of the authorization code flow if it
        becomes available.
    @param URL The redirect URL invoked by the authorization server.
    @discussion When the URL represented a valid authorization response, implementations
        should clean up any left-over UI state from the authorization, for example by
        closing the \SFSafariViewController or looback HTTP listener if those were used.
        The completion block of the pending authorization request should then be invoked.
    @remarks Has no effect if called more than once, or after a @c cancel message was received.
    @return YES if the passed URL matches the expected redirect URL and was consumed, NO otherwise.
 */
- (BOOL)resumeAuthorizationFlowWithURL:(NSURL *)URL;

/*! @brief @c OIDExternalUserAgent implementations should call this method when the
        authorization flow failed with a non-OAuth error.
    @param error The error that is the reason for the failure of this authorization flow.
    @remarks Has no effect if called more than once, or after a @c cancel message was received.
 */
- (void)failAuthorizationFlowWithError:(NSError *)error;

@end
