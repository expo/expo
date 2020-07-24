// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMInternalModule.h>
#import <EDUMEventEmitterService.h>
#import <EDUMModuleRegistryConsumer.h>
#import <EDUMBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface EDUMReactNativeEventEmitter : RCTEventEmitter <EDUMInternalModule, EDUMBridgeModule, EDUMModuleRegistryConsumer, EDUMEventEmitterService>

@end
