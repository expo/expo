// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI35_0_0RCTWrapperReactABI35_0_0RootViewController.h"

#import <ABI35_0_0RCTWrapper/ABI35_0_0RCTWrapper.h>
#import <ReactABI35_0_0/ABI35_0_0RCTBridge.h>
#import <ReactABI35_0_0/ABI35_0_0RCTRootView.h>

#import "ABI35_0_0RCTWrapperExampleView.h"

@implementation ABI35_0_0RCTWrapperReactABI35_0_0RootViewController {
  ABI35_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI35_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI35_0_0RCTRootView *rootView =
    [[ABI35_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI35_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
