// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXEventEmitterService.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>
#import <ABI31_0_0EXReactNativeAdapter/ABI31_0_0EXBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventEmitter.h>

@interface ABI31_0_0EXReactNativeEventEmitter : ABI31_0_0RCTEventEmitter <ABI31_0_0EXInternalModule, ABI31_0_0EXBridgeModule, ABI31_0_0EXModuleRegistryConsumer, ABI31_0_0EXEventEmitterService>

@end
