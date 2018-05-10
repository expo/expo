// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface EXReactNativeEventEmitter : RCTEventEmitter <EXInternalModule, EXBridgeModule, EXModuleRegistryConsumer>

@end
