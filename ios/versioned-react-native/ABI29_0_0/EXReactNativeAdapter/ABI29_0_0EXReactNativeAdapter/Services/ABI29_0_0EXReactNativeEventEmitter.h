// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXEventEmitterService.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXBridgeModule.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventEmitter.h>

@interface ABI29_0_0EXReactNativeEventEmitter : ABI29_0_0RCTEventEmitter <ABI29_0_0EXInternalModule, ABI29_0_0EXBridgeModule, ABI29_0_0EXModuleRegistryConsumer, ABI29_0_0EXEventEmitterService>

@end
