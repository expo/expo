/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTTVNavigationEventEmitter.h"

#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>
#import "ABI41_0_0CoreModulesPlugins.h"

NSString *const ABI41_0_0RCTTVNavigationEventNotification = @"ABI41_0_0RCTTVNavigationEventNotification";

static NSString *const TVNavigationEventName = @"onHWKeyEvent";

@interface ABI41_0_0RCTTVNavigationEventEmitter () <ABI41_0_0NativeTVNavigationEventEmitterSpec>
@end

@implementation ABI41_0_0RCTTVNavigationEventEmitter

ABI41_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:ABI41_0_0RCTTVNavigationEventNotification
                                               object:nil];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ TVNavigationEventName ];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
  if (self.bridge) {
    [self sendEventWithName:TVNavigationEventName body:notif.object];
  }
}

- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI41_0_0facebook::ABI41_0_0React::NativeTVNavigationEventEmitterSpecJSI>(
      self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI41_0_0RCTTVNavigationEventEmitterCls(void)
{
  return ABI41_0_0RCTTVNavigationEventEmitter.class;
}
