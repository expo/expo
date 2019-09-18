// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI35_0_0RCTWrapperReactABI35_0_0RootViewManager.h"

#import <ABI35_0_0RCTWrapper/ABI35_0_0RCTWrapperView.h>
#import <ABI35_0_0RCTWrapper/ABI35_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI35_0_0RCTWrapperReactABI35_0_0RootViewController.h"

@implementation ABI35_0_0RCTWrapperReactABI35_0_0RootViewManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI35_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI35_0_0RCTWrapperReactABI35_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI35_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
