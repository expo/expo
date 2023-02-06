/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTWrapperExampleViewController.h"

#import <ABI48_0_0RCTWrapper/ABI48_0_0RCTWrapper.h>

#import "ABI48_0_0RCTWrapperExampleView.h"

@implementation ABI48_0_0RCTWrapperExampleViewController

- (void)loadView
{
  self.view = [ABI48_0_0RCTWrapperExampleView new];
}

@end

ABI48_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI48_0_0RCTWrapperExampleViewController)
