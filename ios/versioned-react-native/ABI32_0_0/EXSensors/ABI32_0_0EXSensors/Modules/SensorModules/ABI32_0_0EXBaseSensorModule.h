// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

@interface ABI32_0_0EXBaseSensorModule : ABI32_0_0EXExportedModule <ABI32_0_0EXEventEmitter, ABI32_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
