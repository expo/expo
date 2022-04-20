/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTWrapperABI45_0_0ReactRootViewManager.h"

#import <ABI45_0_0RCTWrapper/ABI45_0_0RCTWrapperView.h>
#import <ABI45_0_0RCTWrapper/ABI45_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI45_0_0RCTWrapperABI45_0_0ReactRootViewController.h"

@implementation ABI45_0_0RCTWrapperABI45_0_0ReactRootViewManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI45_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI45_0_0RCTWrapperABI45_0_0ReactRootViewController alloc] initWithBridge:self.bridge];

  ABI45_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
