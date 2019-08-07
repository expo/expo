// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitter.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

@interface ABI33_0_0EXBaseSensorModule : ABI33_0_0UMExportedModule <ABI33_0_0UMEventEmitter, ABI33_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
