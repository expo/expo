// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitterService.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>

@interface ABI38_0_0UMReactNativeEventEmitter : ABI38_0_0RCTEventEmitter <ABI38_0_0UMInternalModule, ABI38_0_0UMBridgeModule, ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMEventEmitterService>

@end
