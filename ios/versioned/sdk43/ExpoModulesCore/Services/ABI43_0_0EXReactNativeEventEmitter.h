// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTEventEmitter.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXBridgeModule.h>

@interface ABI43_0_0EXReactNativeEventEmitter : ABI43_0_0RCTEventEmitter <ABI43_0_0EXInternalModule, ABI43_0_0EXBridgeModule, ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXEventEmitterService>

@end
