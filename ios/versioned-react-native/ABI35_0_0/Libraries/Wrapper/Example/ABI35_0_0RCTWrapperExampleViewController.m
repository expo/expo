// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI35_0_0RCTWrapperExampleViewController.h"

#import <ABI35_0_0RCTWrapper/ABI35_0_0RCTWrapper.h>

#import "ABI35_0_0RCTWrapperExampleView.h"

@implementation ABI35_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI35_0_0RCTWrapperExampleView new];
}

@end

ABI35_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI35_0_0RCTWrapperExampleViewController)
