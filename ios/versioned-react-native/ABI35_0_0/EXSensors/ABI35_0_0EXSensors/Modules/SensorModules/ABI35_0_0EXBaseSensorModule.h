// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitter.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

@interface ABI35_0_0EXBaseSensorModule : ABI35_0_0UMExportedModule <ABI35_0_0UMEventEmitter, ABI35_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
