/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTWrapperExampleViewController.h"

#import <ABI43_0_0RCTWrapper/ABI43_0_0RCTWrapper.h>

#import "ABI43_0_0RCTWrapperExampleView.h"

@implementation ABI43_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI43_0_0RCTWrapperExampleView new];
}

@end

ABI43_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI43_0_0RCTWrapperExampleViewController)
