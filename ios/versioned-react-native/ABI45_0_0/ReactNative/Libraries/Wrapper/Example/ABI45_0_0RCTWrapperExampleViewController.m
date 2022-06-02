/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTWrapperExampleViewController.h"

#import <ABI45_0_0RCTWrapper/ABI45_0_0RCTWrapper.h>

#import "ABI45_0_0RCTWrapperExampleView.h"

@implementation ABI45_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI45_0_0RCTWrapperExampleView new];
}

@end

ABI45_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI45_0_0RCTWrapperExampleViewController)
