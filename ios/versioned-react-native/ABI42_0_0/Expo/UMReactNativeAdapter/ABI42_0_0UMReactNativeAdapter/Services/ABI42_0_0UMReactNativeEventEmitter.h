// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0UMReactNativeEventEmitter : ABI42_0_0RCTEventEmitter <ABI42_0_0UMInternalModule, ABI42_0_0UMBridgeModule, ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMEventEmitterService>

@end
