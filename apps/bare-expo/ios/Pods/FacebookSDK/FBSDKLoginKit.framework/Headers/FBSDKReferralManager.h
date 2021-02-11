// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class FBSDKReferralManagerResult;

/**
  Describes the call back to the FBSDKReferralManager
 @param result the result of the referral
 @param error the referral error, if any.
 */
typedef void (^FBSDKReferralManagerResultBlock)(FBSDKReferralManagerResult *_Nullable result,
                                                NSError *_Nullable error)
NS_SWIFT_NAME(ReferralManagerResultBlock);

/**
 `FBSDKReferralManager` provides methods for starting the referral process.
*/
NS_SWIFT_NAME(ReferralManager)
@interface FBSDKReferralManager : NSObject

/**
 Initialize a new instance with the provided view controller
 @param viewController the view controller to present from. If nil, the topmost  view controller will be automatically determined as best as possible.
 */
- (instancetype)initWithViewController:(nullable UIViewController *)viewController;

/**
 Open the referral dialog.
 @param handler the callback.
 */
-(void)startReferralWithCompletionHandler:(nullable FBSDKReferralManagerResultBlock)handler;

@end

NS_ASSUME_NONNULL_END

#endif
