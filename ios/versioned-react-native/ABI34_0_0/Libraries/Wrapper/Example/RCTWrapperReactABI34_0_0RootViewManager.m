// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI34_0_0RCTWrapperReactABI34_0_0RootViewManager.h"

#import <ABI34_0_0RCTWrapper/ABI34_0_0RCTWrapperView.h>
#import <ABI34_0_0RCTWrapper/ABI34_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI34_0_0RCTWrapperReactABI34_0_0RootViewController.h"

@implementation ABI34_0_0RCTWrapperReactABI34_0_0RootViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI34_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI34_0_0RCTWrapperReactABI34_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI34_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
