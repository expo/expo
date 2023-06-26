// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitterService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXBridgeModule.h>

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class ABI49_0_0EXAppContext;

@interface ABI49_0_0EXReactNativeEventEmitter : ABI49_0_0RCTEventEmitter <ABI49_0_0EXInternalModule, ABI49_0_0EXBridgeModule, ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXEventEmitterService>

@property (nonatomic, strong) ABI49_0_0EXAppContext *appContext;

@end
