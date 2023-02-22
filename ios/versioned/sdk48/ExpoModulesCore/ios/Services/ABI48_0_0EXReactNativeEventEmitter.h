// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXEventEmitterService.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXBridgeModule.h>

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class ABI48_0_0EXAppContext;

@interface ABI48_0_0EXReactNativeEventEmitter : ABI48_0_0RCTEventEmitter <ABI48_0_0EXInternalModule, ABI48_0_0EXBridgeModule, ABI48_0_0EXModuleRegistryConsumer, ABI48_0_0EXEventEmitterService>

@property (nonatomic, strong) ABI48_0_0EXAppContext *appContext;

@end
