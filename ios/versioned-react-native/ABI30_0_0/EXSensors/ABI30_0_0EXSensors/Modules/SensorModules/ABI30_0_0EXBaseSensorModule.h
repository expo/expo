// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

@interface ABI30_0_0EXBaseSensorModule : ABI30_0_0EXExportedModule <ABI30_0_0EXEventEmitter, ABI30_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
