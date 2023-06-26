/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTFabricModalHostViewController.h"

#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceTouchHandler.h>

@implementation ABI49_0_0RCTFabricModalHostViewController {
  CGRect _lastViewBounds;
  ABI49_0_0RCTSurfaceTouchHandler *_touchHandler;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }
  _touchHandler = [ABI49_0_0RCTSurfaceTouchHandler new];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    self.modalInPresentation = YES;
  }
#endif

  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  if (!CGRectEqualToRect(_lastViewBounds, self.view.bounds)) {
    [_delegate boundsDidChange:self.view.bounds];
    _lastViewBounds = self.view.bounds;
  }
}

- (void)loadView
{
  [super loadView];
  [_touchHandler attachToView:self.view];
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [ABI49_0_0RCTSharedApplication() statusBarStyle];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  _lastViewBounds = CGRectZero;
}

- (BOOL)prefersStatusBarHidden
{
  return [ABI49_0_0RCTSharedApplication() isStatusBarHidden];
}

#if ABI49_0_0RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [ABI49_0_0RCTSharedApplication() supportedInterfaceOrientationsForWindow:[ABI49_0_0RCTSharedApplication() keyWindow]];
  if (!(_supportedInterfaceOrientations & appSupportedOrientationsMask)) {
    ABI49_0_0RCTLogError(
        @"Modal was presented with 0x%x orientations mask but the application only supports 0x%x."
        @"Add more interface orientations to your app's Info.plist to fix this."
        @"NOTE: This will crash in non-dev mode.",
        (unsigned)_supportedInterfaceOrientations,
        (unsigned)appSupportedOrientationsMask);
    return UIInterfaceOrientationMaskAll;
  }

  return _supportedInterfaceOrientations;
}
#endif // ABI49_0_0RCT_DEV

@end
