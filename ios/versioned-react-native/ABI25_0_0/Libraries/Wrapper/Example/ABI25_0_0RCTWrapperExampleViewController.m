// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI25_0_0RCTWrapperExampleViewController.h"

#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapper.h>

#import "ABI25_0_0RCTWrapperExampleView.h"

@implementation ABI25_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI25_0_0RCTWrapperExampleView new];
}

@end

ABI25_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI25_0_0RCTWrapperExampleViewController)
