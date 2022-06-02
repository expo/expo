/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTLogBox.h"

#import <ABI45_0_0FBReactNativeSpec/ABI45_0_0FBReactNativeSpec.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTLog.h>
#import <ABI45_0_0React/ABI45_0_0RCTRedBoxSetEnabled.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurface.h>

#import "ABI45_0_0CoreModulesPlugins.h"

#if ABI45_0_0RCT_DEV_MENU

@interface ABI45_0_0RCTLogBox () <ABI45_0_0NativeLogBoxSpec, ABI45_0_0RCTBridgeModule>
@end

@implementation ABI45_0_0RCTLogBox {
  ABI45_0_0RCTLogBoxView *_view;
}

@synthesize bridge = _bridge;

ABI45_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

ABI45_0_0RCT_EXPORT_METHOD(show)
{
  if (ABI45_0_0RCTRedBoxGetEnabled()) {
    __weak ABI45_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI45_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      if (strongSelf->_view) {
        [strongSelf->_view show];
        return;
      }

      if (strongSelf->_bridge) {
        if (strongSelf->_bridge.valid) {
          strongSelf->_view = [[ABI45_0_0RCTLogBoxView alloc] initWithFrame:[UIScreen mainScreen].bounds
                                                            bridge:strongSelf->_bridge];
          [strongSelf->_view show];
        }
      } else {
        NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:strongSelf, @"logbox", nil];
        [[NSNotificationCenter defaultCenter] postNotificationName:@"CreateLogBoxSurface" object:nil userInfo:userInfo];
      }
    });
  }
}

ABI45_0_0RCT_EXPORT_METHOD(hide)
{
  if (ABI45_0_0RCTRedBoxGetEnabled()) {
    __weak ABI45_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI45_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      [strongSelf->_view setHidden:YES];
      strongSelf->_view = nil;
    });
  }
}

- (std::shared_ptr<ABI45_0_0facebook::ABI45_0_0React::TurboModule>)getTurboModule:
    (const ABI45_0_0facebook::ABI45_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI45_0_0facebook::ABI45_0_0React::NativeLogBoxSpecJSI>(params);
}

- (void)setABI45_0_0RCTLogBoxView:(ABI45_0_0RCTLogBoxView *)view
{
  self->_view = view;
}

@end

#else // Disabled

@interface ABI45_0_0RCTLogBox () <ABI45_0_0NativeLogBoxSpec>
@end

@implementation ABI45_0_0RCTLogBox

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

- (std::shared_ptr<ABI45_0_0facebook::ABI45_0_0React::TurboModule>)getTurboModule:
    (const ABI45_0_0facebook::ABI45_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI45_0_0facebook::ABI45_0_0React::NativeLogBoxSpecJSI>(params);
}
@end

#endif

Class ABI45_0_0RCTLogBoxCls(void)
{
  return ABI45_0_0RCTLogBox.class;
}
