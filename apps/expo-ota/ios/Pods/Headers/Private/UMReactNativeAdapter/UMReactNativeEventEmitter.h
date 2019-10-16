// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMInternalModule.h>
#import <UMCore/UMEventEmitterService.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMReactNativeAdapter/UMBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface UMReactNativeEventEmitter : RCTEventEmitter <UMInternalModule, UMBridgeModule, UMModuleRegistryConsumer, UMEventEmitterService>

@end
