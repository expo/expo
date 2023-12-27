/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTWrapperABI44_0_0ReactRootViewManager.h"

#import <ABI44_0_0RCTWrapper/ABI44_0_0RCTWrapperView.h>
#import <ABI44_0_0RCTWrapper/ABI44_0_0RCTWrapperViewControllerHostingView.h>

#import "ABI44_0_0RCTWrapperABI44_0_0ReactRootViewController.h"

@implementation ABI44_0_0RCTWrapperABI44_0_0ReactRootViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =
    [ABI44_0_0RCTWrapperViewControllerHostingView new];

  contentViewControllerHostingView.contentViewController =
    [[ABI44_0_0RCTWrapperABI44_0_0ReactRootViewController alloc] initWithBridge:self.bridge];

  ABI44_0_0RCTWrapperView *wrapperView = [super view];
  wrapperView.contentView = contentViewControllerHostingView;
  return wrapperView;
}

@end
