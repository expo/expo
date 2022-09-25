/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTWrapperABI46_0_0ReactRootViewManager.h"

#import <ABI46_0_0RCTWrapper/ABI46_0_0RCTWrapperView.h>
#import <ABI46_0_0RCTWrapper/ABI46_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI46_0_0RCTWrapperABI46_0_0ReactRootViewController.h"

@implementation ABI46_0_0RCTWrapperABI46_0_0ReactRootViewManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI46_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI46_0_0RCTWrapperABI46_0_0ReactRootViewController alloc] initWithBridge:self.bridge];

  ABI46_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
