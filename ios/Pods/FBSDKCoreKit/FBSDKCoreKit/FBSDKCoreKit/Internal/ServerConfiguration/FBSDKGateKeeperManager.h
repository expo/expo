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

#import <Foundation/Foundation.h>

#define FBSDK_GATEKEEPER_MANAGER_CACHE_TIMEOUT (60 * 60)

NS_ASSUME_NONNULL_BEGIN

/// typedef for FBSDKAppEventUserDataType
typedef NSString *const FBSDKGateKeeperKey NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(GateKeeperManager.GateKeeperKey);
typedef void (^FBSDKGKManagerBlock)(NSError * _Nullable error)
NS_SWIFT_NAME(GKManagerBlock);

@interface FBSDKGateKeeperManager : NSObject
- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 Returns the locally cached configuration.
 */
+ (BOOL)boolForKey:(NSString *)key defaultValue:(BOOL)defaultValue;

/**
 Load the gate keeper configurations from server
 */
+ (void)loadGateKeepers:(nullable FBSDKGKManagerBlock)completionBlock;

@end

NS_ASSUME_NONNULL_END
