/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTTVNavigationEventEmitter.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import "ABI38_0_0CoreModulesPlugins.h"

NSString *const ABI38_0_0RCTTVNavigationEventNotification = @"ABI38_0_0RCTTVNavigationEventNotification";

static NSString *const TVNavigationEventName = @"onHWKeyEvent";

@interface ABI38_0_0RCTTVNavigationEventEmitter() <NativeTVNavigationEventEmitterSpec>
@end

@implementation ABI38_0_0RCTTVNavigationEventEmitter

ABI38_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:ABI38_0_0RCTTVNavigationEventNotification
                                               object:nil];

  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[TVNavigationEventName];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
  if (self.bridge) {
    [self sendEventWithName:TVNavigationEventName body:notif.object];
  }
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeTVNavigationEventEmitterSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTTVNavigationEventEmitterCls(void) {
  return ABI38_0_0RCTTVNavigationEventEmitter.class;
}
