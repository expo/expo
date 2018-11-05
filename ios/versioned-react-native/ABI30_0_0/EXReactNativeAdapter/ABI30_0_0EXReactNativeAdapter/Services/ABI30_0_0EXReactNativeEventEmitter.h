// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitterService.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>

@interface ABI30_0_0EXReactNativeEventEmitter : ABI30_0_0RCTEventEmitter <ABI30_0_0EXInternalModule, ABI30_0_0EXBridgeModule, ABI30_0_0EXModuleRegistryConsumer, ABI30_0_0EXEventEmitterService>

@end
