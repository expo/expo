// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI26_0_0RCTWrapperReactABI26_0_0RootViewController.h"

#import <ABI26_0_0RCTWrapper/ABI26_0_0RCTWrapper.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTRootView.h>

#import "ABI26_0_0RCTWrapperExampleView.h"

@implementation ABI26_0_0RCTWrapperReactABI26_0_0RootViewController {
  ABI26_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI26_0_0RCTRootView *rootView =
    [[ABI26_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI26_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
