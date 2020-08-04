/*! @file OIDAuthorizationService+IOS.m
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

#import "OIDAuthorizationService+IOS.h"
#import "OIDExternalUserAgentIOS.h"
#import "OIDExternalUserAgentCatalyst.h"

NS_ASSUME_NONNULL_BEGIN

@implementation OIDAuthorizationService (IOS)

+ (id<OIDExternalUserAgentSession>) presentAuthorizationRequest:(OIDAuthorizationRequest *)request
    presentingViewController:(UIViewController *)presentingViewController
                    callback:(OIDAuthorizationCallback)callback {
  id<OIDExternalUserAgent> externalUserAgent;
#if TARGET_OS_MACCATALYST
  externalUserAgent = [[OIDExternalUserAgentCatalyst alloc]
      initWithPresentingViewController:presentingViewController];
#else // TARGET_OS_MACCATALYST
  externalUserAgent = [[OIDExternalUserAgentIOS alloc] initWithPresentingViewController:presentingViewController];
#endif // TARGET_OS_MACCATALYST
  return [self presentAuthorizationRequest:request externalUserAgent:externalUserAgent callback:callback];
}

@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_IOS || TARGET_OS_MACCATALYST
