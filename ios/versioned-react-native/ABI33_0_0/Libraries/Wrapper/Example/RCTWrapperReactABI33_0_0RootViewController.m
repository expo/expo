// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI33_0_0RCTWrapperReactABI33_0_0RootViewController.h"

#import <ABI33_0_0RCTWrapper/ABI33_0_0RCTWrapper.h>
#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTRootView.h>

#import "ABI33_0_0RCTWrapperExampleView.h"

@implementation ABI33_0_0RCTWrapperReactABI33_0_0RootViewController {
  ABI33_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI33_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI33_0_0RCTRootView *rootView =
    [[ABI33_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI33_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
