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

#import <Foundation/Foundation.h>

#import "FBSDKReferralCode.h"

NS_ASSUME_NONNULL_BEGIN

/**
  Describes the result of a referral request.
 */
NS_SWIFT_NAME(ReferralManagerResult)
@interface FBSDKReferralManagerResult : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  whether the referral was cancelled by the user.
 */
@property (readonly, nonatomic) BOOL isCancelled;

/**
  An array of referral codes for each referral made by the user
 */
@property (copy, nonatomic) NSArray<FBSDKReferralCode *> *referralCodes;

/** Initializes a new instance.
 @param referralCodes the referral codes
 @param isCancelled whether the referral was cancelled by the user
 */
- (instancetype)initWithReferralCodes:(nullable NSArray<FBSDKReferralCode *> *)referralCodes
                  isCancelled:(BOOL)isCancelled
NS_DESIGNATED_INITIALIZER;
@end

NS_ASSUME_NONNULL_END

#endif
