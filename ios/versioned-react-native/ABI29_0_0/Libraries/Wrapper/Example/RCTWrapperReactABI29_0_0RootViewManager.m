// Copyright (c) 2004-present, Facebook, Inc.
//
// This source code is licensed under the license found in the
// LICENSE-examples file in the root directory of this source tree.

#import "ABI29_0_0RCTWrapperReactABI29_0_0RootViewManager.h"

#import <ABI29_0_0RCTWrapper/ABI29_0_0RCTWrapperView.h>
#import <ABI29_0_0RCTWrapper/ABI29_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI29_0_0RCTWrapperReactABI29_0_0RootViewController.h"

@implementation ABI29_0_0RCTWrapperReactABI29_0_0RootViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI29_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI29_0_0RCTWrapperReactABI29_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI29_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
