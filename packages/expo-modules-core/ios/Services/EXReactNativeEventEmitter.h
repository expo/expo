// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTEventEmitter.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXBridgeModule.h>

@interface EXReactNativeEventEmitter : RCTEventEmitter <EXInternalModule, EXBridgeModule, EXModuleRegistryConsumer, EXEventEmitterService>

@end
