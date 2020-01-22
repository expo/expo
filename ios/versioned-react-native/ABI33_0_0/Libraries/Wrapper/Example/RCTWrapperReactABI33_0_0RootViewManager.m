// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI33_0_0RCTWrapperReactABI33_0_0RootViewManager.h"

#import <ABI33_0_0RCTWrapper/ABI33_0_0RCTWrapperView.h>
#import <ABI33_0_0RCTWrapper/ABI33_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI33_0_0RCTWrapperReactABI33_0_0RootViewController.h"

@implementation ABI33_0_0RCTWrapperReactABI33_0_0RootViewManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI33_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI33_0_0RCTWrapperReactABI33_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI33_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
