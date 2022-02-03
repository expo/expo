/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0RCTConvert (UIStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI42_0_0RCTStatusBarManager : ABI42_0_0RCTEventEmitter

@end
