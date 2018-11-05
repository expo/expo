// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI30_0_0RCTWrapperReactABI30_0_0RootViewManager.h"

#import <ABI30_0_0RCTWrapper/ABI30_0_0RCTWrapperView.h>
#import <ABI30_0_0RCTWrapper/ABI30_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI30_0_0RCTWrapperReactABI30_0_0RootViewController.h"

@implementation ABI30_0_0RCTWrapperReactABI30_0_0RootViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI30_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI30_0_0RCTWrapperReactABI30_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI30_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
