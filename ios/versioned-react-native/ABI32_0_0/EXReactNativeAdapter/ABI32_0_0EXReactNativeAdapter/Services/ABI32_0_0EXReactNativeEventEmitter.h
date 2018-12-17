// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitterService.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXBridgeModule.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventEmitter.h>

@interface ABI32_0_0EXReactNativeEventEmitter : ABI32_0_0RCTEventEmitter <ABI32_0_0EXInternalModule, ABI32_0_0EXBridgeModule, ABI32_0_0EXModuleRegistryConsumer, ABI32_0_0EXEventEmitterService>

@end
