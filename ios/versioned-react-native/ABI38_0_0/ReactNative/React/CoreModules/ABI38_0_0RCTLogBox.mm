/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTLogBox.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTRootView.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTErrorInfo.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTJSStackFrame.h>
#import <ABI38_0_0React/ABI38_0_0RCTRedBoxSetEnabled.h>
#import <ABI38_0_0React/ABI38_0_0RCTReloadCommand.h>
#import <ABI38_0_0React/ABI38_0_0RCTRedBoxSetEnabled.h>
#import <ABI38_0_0React/ABI38_0_0RCTSurface.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

#import <objc/runtime.h>

#import "ABI38_0_0CoreModulesPlugins.h"

#if ABI38_0_0RCT_DEV_MENU

@class ABI38_0_0RCTLogBoxView;

@interface ABI38_0_0RCTLogBoxView : UIWindow
@end

@implementation ABI38_0_0RCTLogBoxView
{
  ABI38_0_0RCTSurface *_surface;
}

- (instancetype)initWithFrame:(CGRect)frame bridge:(ABI38_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];

    _surface = [[ABI38_0_0RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];

    [_surface start];
    [_surface setSize:frame.size];

    if (![_surface synchronouslyWaitForStage:ABI38_0_0RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
      ABI38_0_0RCTLogInfo(@"Failed to mount LogBox within 1s");
    }

    UIViewController *_rootViewController = [UIViewController new];
    _rootViewController.view = (UIView *)_surface.view;
    _rootViewController.view.backgroundColor = [UIColor clearColor];
    _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
    self.rootViewController = _rootViewController;
  }
  return self;
}

- (void)dealloc
{
  [ABI38_0_0RCTSharedApplication().delegate.window makeKeyWindow];
}

- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

@end

@interface ABI38_0_0RCTLogBox () <NativeLogBoxSpec>
@end

@implementation ABI38_0_0RCTLogBox
{
  ABI38_0_0RCTLogBoxView *_view;
}

@synthesize bridge = _bridge;

ABI38_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

ABI38_0_0RCT_EXPORT_METHOD(show)
{
  if (ABI38_0_0RCTRedBoxGetEnabled()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (!self->_view) {
        self->_view = [[ABI38_0_0RCTLogBoxView alloc] initWithFrame:[UIScreen mainScreen].bounds bridge: self->_bridge];
      }
      [self->_view show];
    });
  }
}

ABI38_0_0RCT_EXPORT_METHOD(hide)
{
  if (ABI38_0_0RCTRedBoxGetEnabled()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      self->_view = nil;
    });
  }
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  if (ABI38_0_0RCTRedBoxGetEnabled()) {
    return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeLogBoxSpecJSI>(self, jsInvoker);
  }

  return nullptr;
}

@end

#else // Disabled

@interface ABI38_0_0RCTLogBox() <NativeLogBoxSpec>
@end

@implementation ABI38_0_0RCTLogBox

+ (NSString *)moduleName
{
  return nil;
}

- (void)show {
  // noop
}

- (void)hide {
  // noop
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeLogBoxSpecJSI>(self, jsInvoker);
}
@end

#endif

Class ABI38_0_0RCTLogBoxCls(void) {
  return ABI38_0_0RCTLogBox.class;
}
