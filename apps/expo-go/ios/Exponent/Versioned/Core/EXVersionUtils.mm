// Copyright 2023-present 650 Industries. All rights reserved.

#import <React/RCTUIManager.h>
#import <React/RCTEventDispatcher.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/CoreModulesPlugins.h>
#import <ReactCommon/RCTTurboModule.h>
#import <reacthermes/HermesExecutorFactory.h>

#import <RNReanimated/REAModule.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/ReanimatedVersion.h>

#import <ExpoModulesCore/EXDefines.h>

#import "EXDevSettings.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXVersionUtils.h"

@interface RCTEventDispatcher (REAnimated)
- (void)setBridge:(RCTBridge*)bridge;
@end

@implementation EXVersionUtils

+ (nonnull void *)versionedJsExecutorFactoryForBridge:(nonnull RCTBridge *)bridge
                                               engine:(nonnull NSString *)jsEngine
{
  [bridge moduleForClass:[RCTUIManager class]];

  EX_WEAKIFY(self);
  const auto executor = [EXWeak_self, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    EX_ENSURE_STRONGIFY(self);
  };
  if ([jsEngine isEqualToString:@"hermes"]) {
    return new facebook::react::HermesExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
  }
  return new facebook::react::JSCExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
}

@end
