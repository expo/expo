// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitterService.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXBridgeModule.h>

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class SwiftInteropBridge;

@interface ABI44_0_0EXReactNativeEventEmitter : ABI44_0_0RCTEventEmitter <ABI44_0_0EXInternalModule, ABI44_0_0EXBridgeModule, ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXEventEmitterService>

@property (nonatomic, strong) SwiftInteropBridge *swiftInteropBridge;

@end
