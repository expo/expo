/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>

#import <ABI48_0_0React/ABI48_0_0RCTAlertController.h>

@interface ABI48_0_0RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation ABI48_0_0RCTAlertController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    _alertWindow = [self getUIWindowFromScene];

    if (_alertWindow == nil) {
      UIWindow *keyWindow = ABI48_0_0RCTSharedApplication().keyWindow;
      if (keyWindow) {
        _alertWindow = [[UIWindow alloc] initWithFrame:keyWindow.bounds];
      } else {
        // keyWindow is nil, so we cannot create and initialize _alertWindow
        NSLog(@"Unable to create alert window: keyWindow is nil");
      }
    }

    if (_alertWindow) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
  }

  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  if (@available(iOS 13.0, *)) {
    UIUserInterfaceStyle style =
        ABI48_0_0RCTSharedApplication().delegate.window.overrideUserInterfaceStyle ?: UIUserInterfaceStyleUnspecified;
    self.overrideUserInterfaceStyle = style;
  }
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

- (UIWindow *)getUIWindowFromScene
{
  if (@available(iOS 13.0, *)) {
    for (UIScene *scene in ABI48_0_0RCTSharedApplication().connectedScenes) {
      if (scene.activationState == UISceneActivationStateForegroundActive &&
          [scene isKindOfClass:[UIWindowScene class]]) {
        return [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
      }
    }
  }
  return nil;
}

@end
