/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTUtilsUIOverride.h"

@implementation ABI49_0_0RCTUtilsUIOverride

static UIViewController *_presentedViewController = nil;

+ (void)setPresentedViewController:(UIViewController *)presentedViewController
{
  _presentedViewController = presentedViewController;
}

+ (UIViewController *)presentedViewController
{
  return _presentedViewController;
}

+ (BOOL)hasPresentedViewController
{
  return _presentedViewController != nil;
}

@end
