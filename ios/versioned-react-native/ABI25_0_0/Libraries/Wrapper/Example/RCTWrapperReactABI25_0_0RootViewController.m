// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI25_0_0RCTWrapperReactABI25_0_0RootViewController.h"

#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapper.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTRootView.h>

#import "ABI25_0_0RCTWrapperExampleView.h"

@implementation ABI25_0_0RCTWrapperReactABI25_0_0RootViewController {
  ABI25_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI25_0_0RCTRootView *rootView =
    [[ABI25_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI25_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
