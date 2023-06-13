/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ABI48_0_0RCTUtilsUIOverride : NSObject
/**
 Set the global presented view controller instance override.
 */
+ (void)setPresentedViewController:(UIViewController *)presentedViewController;
+ (UIViewController *)presentedViewController;
+ (BOOL)hasPresentedViewController;

@end
