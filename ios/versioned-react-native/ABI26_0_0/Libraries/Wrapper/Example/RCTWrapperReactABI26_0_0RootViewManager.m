// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI26_0_0RCTWrapperReactABI26_0_0RootViewManager.h"

#import <ABI26_0_0RCTWrapper/ABI26_0_0RCTWrapperView.h>
#import <ABI26_0_0RCTWrapper/ABI26_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI26_0_0RCTWrapperReactABI26_0_0RootViewController.h"

@implementation ABI26_0_0RCTWrapperReactABI26_0_0RootViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI26_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI26_0_0RCTWrapperReactABI26_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI26_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
