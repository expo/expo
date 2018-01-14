// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI25_0_0RCTWrapperReactABI25_0_0RootViewManager.h"

#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapperView.h>
#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI25_0_0RCTWrapperReactABI25_0_0RootViewController.h"

@implementation ABI25_0_0RCTWrapperReactABI25_0_0RootViewManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI25_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI25_0_0RCTWrapperReactABI25_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI25_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
