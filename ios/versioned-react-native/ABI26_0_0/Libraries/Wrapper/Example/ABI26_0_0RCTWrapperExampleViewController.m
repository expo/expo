// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI26_0_0RCTWrapperExampleViewController.h"

#import <ABI26_0_0RCTWrapper/ABI26_0_0RCTWrapper.h>

#import "ABI26_0_0RCTWrapperExampleView.h"

@implementation ABI26_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI26_0_0RCTWrapperExampleView new];
}

@end

ABI26_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI26_0_0RCTWrapperExampleViewController)
