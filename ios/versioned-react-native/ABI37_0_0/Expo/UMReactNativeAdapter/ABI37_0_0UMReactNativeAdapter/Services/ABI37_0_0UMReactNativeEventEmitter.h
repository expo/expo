// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>

@interface ABI37_0_0UMReactNativeEventEmitter : ABI37_0_0RCTEventEmitter <ABI37_0_0UMInternalModule, ABI37_0_0UMBridgeModule, ABI37_0_0UMModuleRegistryConsumer, ABI37_0_0UMEventEmitterService>

@end
