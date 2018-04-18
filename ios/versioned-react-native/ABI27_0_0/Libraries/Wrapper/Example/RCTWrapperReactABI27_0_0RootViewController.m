// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI27_0_0RCTWrapperReactABI27_0_0RootViewController.h"

#import <ABI27_0_0RCTWrapper/ABI27_0_0RCTWrapper.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTRootView.h>

#import "ABI27_0_0RCTWrapperExampleView.h"

@implementation ABI27_0_0RCTWrapperReactABI27_0_0RootViewController {
  ABI27_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI27_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI27_0_0RCTRootView *rootView =
    [[ABI27_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI27_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
