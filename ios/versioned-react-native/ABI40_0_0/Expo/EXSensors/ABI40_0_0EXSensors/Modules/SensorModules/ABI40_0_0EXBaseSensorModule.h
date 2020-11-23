// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0EXBaseSensorModule : ABI40_0_0UMExportedModule <ABI40_0_0UMEventEmitter, ABI40_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
