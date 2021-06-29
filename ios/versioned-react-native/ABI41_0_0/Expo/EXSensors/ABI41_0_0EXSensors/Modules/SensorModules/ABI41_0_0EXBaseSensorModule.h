// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

@interface ABI41_0_0EXBaseSensorModule : ABI41_0_0UMExportedModule <ABI41_0_0UMEventEmitter, ABI41_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
