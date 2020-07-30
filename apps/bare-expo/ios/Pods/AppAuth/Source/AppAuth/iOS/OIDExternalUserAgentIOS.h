/*! @file OIDExternalUserAgentIOS.h
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

#import <TargetConditionals.h>

#if TARGET_OS_IOS || TARGET_OS_MACCATALYST

#import <UIKit/UIKit.h>

#import "OIDExternalUserAgent.h"

@class SFSafariViewController;

NS_ASSUME_NONNULL_BEGIN

/*! @brief An iOS specific external user-agent that uses the best possible user-agent available
        depending on the version of iOS to present the request.
 */
API_UNAVAILABLE(macCatalyst)
@interface OIDExternalUserAgentIOS : NSObject<OIDExternalUserAgent>

- (nullable instancetype)init API_AVAILABLE(ios(11))
    __deprecated_msg("This method will not work on iOS 13, use "
                     "initWithPresentingViewController:presentingViewController");

/*! @brief The designated initializer.
    @param presentingViewController The view controller from which to present the
        \SFSafariViewController.
 */
- (nullable instancetype)initWithPresentingViewController:
    (UIViewController *)presentingViewController
    NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_IOS || TARGET_OS_MACCATALYST
