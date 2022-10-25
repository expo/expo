/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTWrapperABI47_0_0ReactRootViewController.h"

#import <ABI47_0_0RCTWrapper/ABI47_0_0RCTWrapper.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>

#import "ABI47_0_0RCTWrapperExampleView.h"

@implementation ABI47_0_0RCTWrapperABI47_0_0ReactRootViewController {
  ABI47_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI47_0_0RCTRootView *rootView =
    [[ABI47_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI47_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
