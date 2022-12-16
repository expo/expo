// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTEventEmitter.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitterService.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXBridgeModule.h>

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class ABI46_0_0EXAppContext;

@interface ABI46_0_0EXReactNativeEventEmitter : ABI46_0_0RCTEventEmitter <ABI46_0_0EXInternalModule, ABI46_0_0EXBridgeModule, ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXEventEmitterService>

@property (nonatomic, strong) ABI46_0_0EXAppContext *appContext;

@end
