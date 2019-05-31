// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitterService.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMBridgeModule.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventEmitter.h>

@interface ABI33_0_0UMReactNativeEventEmitter : ABI33_0_0RCTEventEmitter <ABI33_0_0UMInternalModule, ABI33_0_0UMBridgeModule, ABI33_0_0UMModuleRegistryConsumer, ABI33_0_0UMEventEmitterService>

@end
