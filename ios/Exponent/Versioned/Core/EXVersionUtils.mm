// Copyright 2023-present 650 Industries. All rights reserved.

#import <React/RCTUIManager.h>
#import <React/RCTEventDispatcher.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/CoreModulesPlugins.h>
#import <ReactCommon/RCTTurboModule.h>
#import <reacthermes/HermesExecutorFactory.h>

#import <RNReanimated/REAModule.h>
#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/REAUIManager.h>
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
  REAUIManager *reaUiManager = [REAUIManager new];
  [reaUiManager setBridge:bridge];
  RCTUIManager *uiManager = reaUiManager;
  [bridge updateModuleWithInstance:uiManager];

  [bridge moduleForClass:[RCTEventDispatcher class]];
  RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  RCTCallableJSModules *callableJSModules = [RCTCallableJSModules new];
  [bridge setValue:callableJSModules forKey:@"_callableJSModules"];
  [callableJSModules setBridge:bridge];
  [eventDispatcher setValue:callableJSModules forKey:@"_callableJSModules"];
  [eventDispatcher setValue:bridge forKey:@"_bridge"];
  [eventDispatcher initialize];
  [bridge updateModuleWithInstance:eventDispatcher];

  EX_WEAKIFY(self);
  const auto executor = [EXWeak_self, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    EX_ENSURE_STRONGIFY(self);
    auto reanimatedModule = reanimated::createReanimatedModule(bridge, bridge.jsCallInvoker);
    auto workletRuntimeValue = runtime
      .global()
      .getProperty(runtime, "ArrayBuffer")
      .asObject(runtime)
      .asFunction(runtime)
      .callAsConstructor(runtime, {static_cast<double>(sizeof(void*))});
    uintptr_t* workletRuntimeData = reinterpret_cast<uintptr_t*>(
                                                                 workletRuntimeValue.getObject(runtime).getArrayBuffer(runtime).data(runtime));
    workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedModule->runtime.get());
    runtime.global().setProperty(
                                 runtime,
                                 "_WORKLET_RUNTIME",
                                 workletRuntimeValue);
    runtime.global().setProperty(
                                 runtime,
                                 "_REANIMATED_VERSION_CPP",
                                 reanimated::getReanimatedVersionString(runtime));

    runtime.global().setProperty(
                                 runtime,
                                 jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                 jsi::Object::createFromHostObject(runtime, reanimatedModule));
  };
  if ([jsEngine isEqualToString:@"hermes"]) {
    return new facebook::react::HermesExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
  }
  return new facebook::react::JSCExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
}

@end
