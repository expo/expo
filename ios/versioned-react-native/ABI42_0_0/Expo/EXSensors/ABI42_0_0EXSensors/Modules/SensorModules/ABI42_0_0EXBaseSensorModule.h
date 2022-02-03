// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

@interface ABI42_0_0EXBaseSensorModule : ABI42_0_0UMExportedModule <ABI42_0_0UMEventEmitter, ABI42_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
