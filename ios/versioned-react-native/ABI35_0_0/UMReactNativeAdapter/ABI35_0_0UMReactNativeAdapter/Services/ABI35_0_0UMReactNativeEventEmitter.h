// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitterService.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <ABI35_0_0UMReactNativeAdapter/ABI35_0_0UMBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventEmitter.h>

@interface ABI35_0_0UMReactNativeEventEmitter : ABI35_0_0RCTEventEmitter <ABI35_0_0UMInternalModule, ABI35_0_0UMBridgeModule, ABI35_0_0UMModuleRegistryConsumer, ABI35_0_0UMEventEmitterService>

@end
