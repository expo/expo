/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTUtils.h>

#import <ABI45_0_0React/ABI45_0_0RCTAlertController.h>

@interface ABI45_0_0RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation ABI45_0_0RCTAlertController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    _alertWindow = [[UIWindow alloc] initWithFrame:ABI45_0_0RCTSharedApplication().keyWindow.bounds];
    _alertWindow.rootViewController = [UIViewController new];
    _alertWindow.windowLevel = UIWindowLevelAlert + 1;
  }
  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

- (void)hide
{
  [_alertWindow setHidden:YES];

  if (@available(iOS 13, *)) {
    _alertWindow.windowScene = nil;
  }

  _alertWindow = nil;
}

@end
