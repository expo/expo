/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTLogBox.h"

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTRedBoxSetEnabled.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurface.h>

#import "ABI43_0_0CoreModulesPlugins.h"

#if ABI43_0_0RCT_DEV_MENU

@interface ABI43_0_0RCTLogBox () <ABI43_0_0NativeLogBoxSpec, ABI43_0_0RCTBridgeModule>
@end

@implementation ABI43_0_0RCTLogBox {
  ABI43_0_0RCTLogBoxView *_view;
}

@synthesize bridge = _bridge;

ABI43_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

ABI43_0_0RCT_EXPORT_METHOD(show)
{
  if (ABI43_0_0RCTRedBoxGetEnabled()) {
    __weak ABI43_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI43_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      if (!strongSelf->_view) {
        if (self->_bridge) {
          strongSelf->_view = [[ABI43_0_0RCTLogBoxView alloc] initWithFrame:[UIScreen mainScreen].bounds bridge:self->_bridge];
        } else {
          NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:strongSelf, @"logbox", nil];
          [[NSNotificationCenter defaultCenter] postNotificationName:@"CreateLogBoxSurface"
                                                              object:nil
                                                            userInfo:userInfo];
          return;
        }
      }
      [strongSelf->_view show];
    });
  }
}

ABI43_0_0RCT_EXPORT_METHOD(hide)
{
  if (ABI43_0_0RCTRedBoxGetEnabled()) {
    __weak ABI43_0_0RCTLogBox *weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
      __strong ABI43_0_0RCTLogBox *strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }
      strongSelf->_view = nil;
    });
  }
}

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeLogBoxSpecJSI>(params);
}

- (void)setABI43_0_0RCTLogBoxView:(ABI43_0_0RCTLogBoxView *)view
{
  self->_view = view;
}

@end

#else // Disabled

@interface ABI43_0_0RCTLogBox () <ABI43_0_0NativeLogBoxSpec>
@end

@implementation ABI43_0_0RCTLogBox

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

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeLogBoxSpecJSI>(params);
}
@end

#endif

Class ABI43_0_0RCTLogBoxCls(void)
{
  return ABI43_0_0RCTLogBox.class;
}
