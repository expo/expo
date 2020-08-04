// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

@interface ABI37_0_0EXBaseSensorModule : ABI37_0_0UMExportedModule <ABI37_0_0UMEventEmitter, ABI37_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
