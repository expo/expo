// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitterService.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventEmitter.h>

@interface ABI36_0_0UMReactNativeEventEmitter : ABI36_0_0RCTEventEmitter <ABI36_0_0UMInternalModule, ABI36_0_0UMBridgeModule, ABI36_0_0UMModuleRegistryConsumer, ABI36_0_0UMEventEmitterService>

@end
