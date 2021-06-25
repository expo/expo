/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTWrapperABI40_0_0ReactRootViewManager.h"

#import <ABI40_0_0RCTWrapper/ABI40_0_0RCTWrapperView.h>
#import <ABI40_0_0RCTWrapper/ABI40_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI40_0_0RCTWrapperABI40_0_0ReactRootViewController.h"

@implementation ABI40_0_0RCTWrapperABI40_0_0ReactRootViewManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI40_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI40_0_0RCTWrapperABI40_0_0ReactRootViewController alloc] initWithBridge:self.bridge];

  ABI40_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
