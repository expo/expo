// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI24_0_0RCTWrapperExampleViewController.h"

#import <ABI24_0_0RCTWrapper/ABI24_0_0RCTWrapper.h>

#import "ABI24_0_0RCTWrapperExampleView.h"

@implementation ABI24_0_0RCTWrapperExampleViewController

- (void)loadView {
  self.view = [ABI24_0_0RCTWrapperExampleView new];
}

@end

ABI24_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ABI24_0_0RCTWrapperExampleViewController)
