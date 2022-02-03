/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTDevLoadingView.h>

#import <QuartzCore/QuartzCore.h>

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTAppearance.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>
#import <ABI43_0_0React/ABI43_0_0RCTDevLoadingViewSetEnabled.h>
#import <ABI43_0_0React/ABI43_0_0RCTModalHostViewController.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import "ABI43_0_0CoreModulesPlugins.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTDevLoadingView () <ABI43_0_0NativeDevLoadingViewSpec>
@end

#if ABI43_0_0RCT_DEV | ABI43_0_0RCT_ENABLE_LOADING_VIEW

@implementation ABI43_0_0RCTDevLoadingView {
  UIWindow *_window;
  UILabel *_label;
  NSDate *_showDate;
  BOOL _hiding;
  dispatch_block_t _initialMessageBlock;
}

@synthesize bridge = _bridge;

ABI43_0_0RCT_EXPORT_MODULE()

+ (void)setEnabled:(BOOL)enabled
{
  ABI43_0_0RCTDevLoadingViewSetEnabled(enabled);
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(hide)
                                               name:ABI43_0_0RCTJavaScriptDidLoadNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(hide)
                                               name:ABI43_0_0RCTJavaScriptDidFailToLoadNotification
                                             object:nil];

  if (bridge.loading) {
    [self showWithURL:bridge.bundleURL];
  }
}

- (void)clearInitialMessageDelay
{
  if (self->_initialMessageBlock != nil) {
    dispatch_block_cancel(self->_initialMessageBlock);
    self->_initialMessageBlock = nil;
  }
}

- (void)showInitialMessageDelayed:(void (^)())initialMessage
{
  self->_initialMessageBlock = dispatch_block_create(static_cast<dispatch_block_flags_t>(0), initialMessage);

  // We delay the initial loading message to prevent flashing it
  // when loading progress starts quickly. To do that, we
  // schedule the message to be shown in a block, and cancel
  // the block later when the progress starts coming in.
  // If the progress beats this timer, this message is not shown.
  dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, 0.2 * NSEC_PER_SEC), dispatch_get_main_queue(), self->_initialMessageBlock);
}

- (UIColor *)dimColor:(UIColor *)c
{
  // Given a color, return a slightly lighter or darker color for dim effect.
  CGFloat h, s, b, a;
  if ([c getHue:&h saturation:&s brightness:&b alpha:&a])
    return [UIColor colorWithHue:h saturation:s brightness:b < 0.5 ? b * 1.25 : b * 0.75 alpha:a];
  return nil;
}

- (NSString *)getTextForHost
{
  if (self->_bridge.bundleURL == nil || self->_bridge.bundleURL.fileURL) {
    return @"ABI43_0_0React Native";
  }

  return [NSString stringWithFormat:@"%@:%@", self->_bridge.bundleURL.host, self->_bridge.bundleURL.port];
}

- (void)showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor
{
  if (!ABI43_0_0RCTDevLoadingViewGetEnabled() || self->_hiding) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_showDate = [NSDate date];
    if (!self->_window && !ABI43_0_0RCTRunningInTestEnvironment()) {
      CGSize screenSize = [UIScreen mainScreen].bounds.size;

      if (@available(iOS 11.0, *)) {
        UIWindow *window = ABI43_0_0RCTSharedApplication().keyWindow;
        self->_window =
            [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, screenSize.width, window.safeAreaInsets.top + 10)];
        self->_label =
            [[UILabel alloc] initWithFrame:CGRectMake(0, window.safeAreaInsets.top - 10, screenSize.width, 20)];
      } else {
        self->_window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, screenSize.width, 20)];
        self->_label = [[UILabel alloc] initWithFrame:self->_window.bounds];
      }
      [self->_window addSubview:self->_label];

      self->_window.windowLevel = UIWindowLevelStatusBar + 1;
      // set a root VC so rotation is supported
      self->_window.rootViewController = [UIViewController new];

      self->_label.font = [UIFont monospacedDigitSystemFontOfSize:12.0 weight:UIFontWeightRegular];
      self->_label.textAlignment = NSTextAlignmentCenter;
    }

    self->_label.text = message;
    self->_label.textColor = color;

    self->_window.backgroundColor = backgroundColor;
    self->_window.hidden = NO;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
      UIWindowScene *scene = (UIWindowScene *)ABI43_0_0RCTSharedApplication().connectedScenes.anyObject;
      self->_window.windowScene = scene;
    }
#endif
  });
}

ABI43_0_0RCT_EXPORT_METHOD(showMessage
                  : (NSString *)message withColor
                  : (NSNumber *__nonnull)color withBackgroundColor
                  : (NSNumber *__nonnull)backgroundColor)
{
  [self showMessage:message color:[ABI43_0_0RCTConvert UIColor:color] backgroundColor:[ABI43_0_0RCTConvert UIColor:backgroundColor]];
}

ABI43_0_0RCT_EXPORT_METHOD(hide)
{
  if (!ABI43_0_0RCTDevLoadingViewGetEnabled()) {
    return;
  }

  // Cancel the initial message block so it doesn't display later and get stuck.
  [self clearInitialMessageDelay];

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_hiding = true;
    const NSTimeInterval MIN_PRESENTED_TIME = 0.6;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:self->_showDate];
    NSTimeInterval delay = MAX(0, MIN_PRESENTED_TIME - presentedTime);
    CGRect windowFrame = self->_window.frame;
    [UIView animateWithDuration:0.25
        delay:delay
        options:0
        animations:^{
          self->_window.frame = CGRectOffset(windowFrame, 0, -windowFrame.size.height);
        }
        completion:^(__unused BOOL finished) {
          self->_window.frame = windowFrame;
          self->_window.hidden = YES;
          self->_window = nil;
          self->_hiding = false;
        }];
  });
}

- (void)showProgressMessage:(NSString *)message
{
  if (self->_window != nil) {
    // This is an optimization. Since the progress can come in quickly,
    // we want to do the minimum amount of work to update the UI,
    // which is to only update the label text.
    self->_label.text = message;
    return;
  }

  UIColor *color = [UIColor whiteColor];
  UIColor *backgroundColor = [UIColor colorWithHue:105 saturation:0 brightness:.25 alpha:1];

  if ([self isDarkModeEnabled]) {
    color = [UIColor colorWithHue:208 saturation:0.03 brightness:.14 alpha:1];
    backgroundColor = [UIColor colorWithHue:0 saturation:0 brightness:0.98 alpha:1];
  }

  [self showMessage:message color:color backgroundColor:backgroundColor];
}

- (void)showOfflineMessage
{
  UIColor *color = [UIColor whiteColor];
  UIColor *backgroundColor = [UIColor blackColor];

  if ([self isDarkModeEnabled]) {
    color = [UIColor blackColor];
    backgroundColor = [UIColor whiteColor];
  }

  NSString *message = [NSString stringWithFormat:@"Connect to %@ to develop JavaScript.", ABI43_0_0RCT_PACKAGER_NAME];
  [self showMessage:message color:color backgroundColor:backgroundColor];
}

- (BOOL)isDarkModeEnabled
{
  // We pass nil here to match the behavior of the native module.
  // If we were to pass a view, then it's possible that this native
  // banner would have a different color than the JavaScript banner
  // (which always passes nil). This would result in an inconsistent UI.
  return [ABI43_0_0RCTColorSchemePreference(nil) isEqualToString:@"dark"];
}
- (void)showWithURL:(NSURL *)URL
{
  if (URL.fileURL) {
    // If dev mode is not enabled, we don't want to show this kind of notification.
#if !ABI43_0_0RCT_DEV
    return;
#endif
    [self showOfflineMessage];
  } else {
    [self showInitialMessageDelayed:^{
      NSString *message = [NSString stringWithFormat:@"Loading from %@\u2026", ABI43_0_0RCT_PACKAGER_NAME];
      [self showProgressMessage:message];
    }];
  }
}

- (void)updateProgress:(ABI43_0_0RCTLoadingProgress *)progress
{
  if (!progress) {
    return;
  }

  // Cancel the initial message block so it's not flashed before progress.
  [self clearInitialMessageDelay];

  dispatch_async(dispatch_get_main_queue(), ^{
    [self showProgressMessage:[progress description]];
  });
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevLoadingViewSpecJSI>(params);
}

@end

#else

@implementation ABI43_0_0RCTDevLoadingView

+ (NSString *)moduleName
{
  return nil;
}
+ (void)setEnabled:(BOOL)enabled
{
}
- (void)showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor
{
}
- (void)showMessage:(NSString *)message withColor:(NSNumber *)color withBackgroundColor:(NSNumber *)backgroundColor
{
}
- (void)showWithURL:(NSURL *)URL
{
}
- (void)updateProgress:(ABI43_0_0RCTLoadingProgress *)progress
{
}
- (void)hide
{
}
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevLoadingViewSpecJSI>(params);
}

@end

#endif

Class ABI43_0_0RCTDevLoadingViewCls(void)
{
  return ABI43_0_0RCTDevLoadingView.class;
}
