/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTFabricModalHostViewController.h"

#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfaceTouchHandler.h>

@implementation ABI37_0_0RCTFabricModalHostViewController {
  CGRect _lastViewBounds;
  ABI37_0_0RCTSurfaceTouchHandler *_touchHandler;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }
  _touchHandler = [ABI37_0_0RCTSurfaceTouchHandler new];

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

#if !TARGET_OS_TV
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [ABI37_0_0RCTSharedApplication() statusBarStyle];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  _lastViewBounds = CGRectZero;
}

- (BOOL)prefersStatusBarHidden
{
  return [ABI37_0_0RCTSharedApplication() isStatusBarHidden];
}

- (void)dismissViewControllerAnimated:(BOOL)flag completion:(void (^)())completion
{
  UIView *snapshot = [self.view snapshotViewAfterScreenUpdates:NO];
  [self.view addSubview:snapshot];

  [super dismissViewControllerAnimated:flag
                            completion:^{
                              [snapshot removeFromSuperview];
                              if (completion) {
                                completion();
                              }
                            }];
}

#if ABI37_0_0RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [ABI37_0_0RCTSharedApplication() supportedInterfaceOrientationsForWindow:[ABI37_0_0RCTSharedApplication() keyWindow]];
  if (!(_supportedInterfaceOrientations & appSupportedOrientationsMask)) {
    ABI37_0_0RCTLogError(
        @"Modal was presented with 0x%x orientations mask but the application only supports 0x%x."
        @"Add more interface orientations to your app's Info.plist to fix this."
        @"NOTE: This will crash in non-dev mode.",
        (unsigned)_supportedInterfaceOrientations,
        (unsigned)appSupportedOrientationsMask);
    return UIInterfaceOrientationMaskAll;
  }

  return _supportedInterfaceOrientations;
}
#endif // ABI37_0_0RCT_DEV
#endif // !TARGET_OS_TV

@end
