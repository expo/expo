// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI24_0_0RCTWrapperReactABI24_0_0RootViewManager.h"

#import <ABI24_0_0RCTWrapper/ABI24_0_0RCTWrapperView.h>
#import <ABI24_0_0RCTWrapper/ABI24_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI24_0_0RCTWrapperReactABI24_0_0RootViewController.h"

@implementation ABI24_0_0RCTWrapperReactABI24_0_0RootViewManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI24_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI24_0_0RCTWrapperReactABI24_0_0RootViewController alloc] initWithBridge:self.bridge];

  ABI24_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
