// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitterService.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventEmitter.h>

@interface ABI34_0_0UMReactNativeEventEmitter : ABI34_0_0RCTEventEmitter <ABI34_0_0UMInternalModule, ABI34_0_0UMBridgeModule, ABI34_0_0UMModuleRegistryConsumer, ABI34_0_0UMEventEmitterService>

@end
