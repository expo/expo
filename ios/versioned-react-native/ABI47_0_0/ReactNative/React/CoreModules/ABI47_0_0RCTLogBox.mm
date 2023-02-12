/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTLogBox.h"

#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTRedBoxSetEnabled.h>
#import <ABI47_0_0React/ABI47_0_0RCTSurface.h>
#import "ABI47_0_0CoreModulesPlugins.h"

#if ABI47_0_0RCT_DEV_MENU

@interface ABI47_0_0RCTLogBox () <ABI47_0_0NativeLogBoxSpec, ABI47_0_0RCTBridgeModule>
@end

@implementation ABI47_0_0RCTLogBox {
  ABI47_0_0RCTLogBoxView *_view;
  __weak id<ABI47_0_0RCTSurfacePresenterStub> _bridgelessSurfacePresenter;
}

@synthesize bridge = _bridge;

ABI47_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)setSurfacePresenter:(id<ABI47_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  _bridgelessSurfacePresenter = surfacePresenter;
}

ABI47_0_0RCT_EXPORT_METHOD(show)
{
  if (ABI47_0_0RCTRedBoxGetEnabled()) {
    __weak ABI47_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI47_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      if (strongSelf->_view) {
        [strongSelf->_view show];
        return;
      }

      if (strongSelf->_bridgelessSurfacePresenter) {
        strongSelf->_view = [[ABI47_0_0RCTLogBoxView alloc] initWithWindow:ABI47_0_0RCTKeyWindow()
                                                 surfacePresenter:strongSelf->_bridgelessSurfacePresenter];
        [strongSelf->_view show];
      } else if (strongSelf->_bridge && strongSelf->_bridge.valid) {
        if (strongSelf->_bridge.surfacePresenter) {
          strongSelf->_view = [[ABI47_0_0RCTLogBoxView alloc] initWithWindow:ABI47_0_0RCTKeyWindow()
                                                   surfacePresenter:strongSelf->_bridge.surfacePresenter];
        } else {
          strongSelf->_view = [[ABI47_0_0RCTLogBoxView alloc] initWithWindow:ABI47_0_0RCTKeyWindow() bridge:strongSelf->_bridge];
        }
        [strongSelf->_view show];
      }
    });
  }
}

ABI47_0_0RCT_EXPORT_METHOD(hide)
{
  if (ABI47_0_0RCTRedBoxGetEnabled()) {
    __weak ABI47_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI47_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      [strongSelf->_view setHidden:YES];
      strongSelf->_view = nil;
    });
  }
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeLogBoxSpecJSI>(params);
}

- (void)setABI47_0_0RCTLogBoxView:(ABI47_0_0RCTLogBoxView *)view
{
  self->_view = view;
}

@end

#else // Disabled

@interface ABI47_0_0RCTLogBox () <ABI47_0_0NativeLogBoxSpec>
@end

@implementation ABI47_0_0RCTLogBox

+ (NSString *)moduleName
{
  return nil;
}

- (void)show
{
  // noop
}

- (void)hide
{
  // noop
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeLogBoxSpecJSI>(params);
}
@end

#endif

Class ABI47_0_0RCTLogBoxCls(void)
{
  return ABI47_0_0RCTLogBox.class;
}
