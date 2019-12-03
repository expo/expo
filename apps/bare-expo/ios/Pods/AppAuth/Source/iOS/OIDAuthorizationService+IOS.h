/*! @file OIDAuthorizationService+IOS.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 Google Inc. All Rights Reserved.
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

#import <UIKit/UIKit.h>

#import "OIDAuthorizationService.h"
#import "OIDExternalUserAgentSession.h"

NS_ASSUME_NONNULL_BEGIN

/*! @brief Provides iOS specific authorization request handling.
 */
@interface OIDAuthorizationService (IOS)

/*! @brief Perform an authorization flow using \SFSafariViewController.
    @param request The authorization request.
    @param presentingViewController The view controller from which to present the
        \SFSafariViewController.
    @param callback The method called when the request has completed or failed.
    @return A @c OIDExternalUserAgentSession instance which will terminate when it
        receives a @c OIDExternalUserAgentSession.cancel message, or after processing a
        @c OIDExternalUserAgentSession.resumeExternalUserAgentFlowWithURL: message.
 */
+ (id<OIDExternalUserAgentSession>) presentAuthorizationRequest:(OIDAuthorizationRequest *)request
    presentingViewController:(UIViewController *)presentingViewController
                    callback:(OIDAuthorizationCallback)callback;
@end

NS_ASSUME_NONNULL_END
