// Copyright 2004-present Facebook. All Rights Reserved.

#import "ABI24_0_0RCTWrapperReactABI24_0_0RootViewController.h"

#import <ABI24_0_0RCTWrapper/ABI24_0_0RCTWrapper.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTRootView.h>

#import "ABI24_0_0RCTWrapperExampleView.h"

@implementation ABI24_0_0RCTWrapperReactABI24_0_0RootViewController {
  ABI24_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _bridge = bridge;
  }

  return self;
}

- (void)loadView
{
  ABI24_0_0RCTRootView *rootView =
    [[ABI24_0_0RCTRootView alloc] initWithBridge:_bridge
                             moduleName:@"WrapperExample"
                      initialProperties:@{}];

  rootView.backgroundColor = [UIColor whiteColor];

  UIActivityIndicatorView *progressIndicatorView =
    [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [progressIndicatorView startAnimating];
  rootView.loadingView = progressIndicatorView;

  rootView.sizeFlexibility = ABI24_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
  self.view = rootView;
}

@end
