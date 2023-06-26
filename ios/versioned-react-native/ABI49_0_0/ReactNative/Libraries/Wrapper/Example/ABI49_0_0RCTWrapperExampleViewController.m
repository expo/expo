/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTWrapperExampleViewController.h"

#import <ABI49_0_0RCTWrapper/ABI49_0_0RCTWrapper.h>

#import "ABI49_0_0RCTWrapperExampleView.h"

@implementation ABI49_0_0RCTWrapperExampleViewController

- (void)loadView
{
  self.view = [ABI49_0_0RCTWrapperExampleView new];
}

@end

ABI49_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI49_0_0RCTWrapperExampleViewController)
