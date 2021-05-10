// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventEmitter.h>

@interface ABI40_0_0UMReactNativeEventEmitter : ABI40_0_0RCTEventEmitter <ABI40_0_0UMInternalModule, ABI40_0_0UMBridgeModule, ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMEventEmitterService>

@end
