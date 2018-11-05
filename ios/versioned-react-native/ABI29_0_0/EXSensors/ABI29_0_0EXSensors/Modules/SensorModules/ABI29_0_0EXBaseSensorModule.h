// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXExportedModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXEventEmitter.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>

@interface ABI29_0_0EXBaseSensorModule : ABI29_0_0EXExportedModule <ABI29_0_0EXEventEmitter, ABI29_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
