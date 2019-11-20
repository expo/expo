// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI34_0_0RCTWrapperExampleViewController.h"

#import <ABI34_0_0RCTWrapper/ABI34_0_0RCTWrapper.h>

#import "ABI34_0_0RCTWrapperExampleView.h"

@implementation ABI34_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI34_0_0RCTWrapperExampleView new];
}

@end

ABI34_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI34_0_0RCTWrapperExampleViewController)
