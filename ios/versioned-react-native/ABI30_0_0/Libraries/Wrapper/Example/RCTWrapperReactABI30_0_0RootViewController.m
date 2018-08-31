// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI30_0_0RCTWrapperReactABI30_0_0RootViewController.h"

#import <ABI30_0_0RCTWrapper/ABI30_0_0RCTWrapper.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTRootView.h>

#import "ABI30_0_0RCTWrapperExampleView.h"

@implementation ABI30_0_0RCTWrapperReactABI30_0_0RootViewController {
  ABI30_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI30_0_0RCTRootView *rootView =
    [[ABI30_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI30_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
