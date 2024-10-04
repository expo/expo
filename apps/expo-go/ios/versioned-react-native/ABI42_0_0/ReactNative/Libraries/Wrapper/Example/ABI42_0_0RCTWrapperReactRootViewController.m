/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTWrapperABI42_0_0ReactRootViewController.h"

#import <ABI42_0_0RCTWrapper/ABI42_0_0RCTWrapper.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTRootView.h>

#import "ABI42_0_0RCTWrapperExampleView.h"

@implementation ABI42_0_0RCTWrapperABI42_0_0ReactRootViewController {
  ABI42_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI42_0_0RCTRootView *rootView =
    [[ABI42_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI42_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
