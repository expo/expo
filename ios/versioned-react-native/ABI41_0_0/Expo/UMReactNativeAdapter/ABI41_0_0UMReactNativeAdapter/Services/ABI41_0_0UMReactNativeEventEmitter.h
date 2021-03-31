// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>

@interface ABI41_0_0UMReactNativeEventEmitter : ABI41_0_0RCTEventEmitter <ABI41_0_0UMInternalModule, ABI41_0_0UMBridgeModule, ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0UMEventEmitterService>

@end
