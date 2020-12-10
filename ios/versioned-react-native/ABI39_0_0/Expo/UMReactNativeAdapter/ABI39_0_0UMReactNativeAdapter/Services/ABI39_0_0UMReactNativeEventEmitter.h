// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitterService.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMBridgeModule.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventEmitter.h>

@interface ABI39_0_0UMReactNativeEventEmitter : ABI39_0_0RCTEventEmitter <ABI39_0_0UMInternalModule, ABI39_0_0UMBridgeModule, ABI39_0_0UMModuleRegistryConsumer, ABI39_0_0UMEventEmitterService>

@end
