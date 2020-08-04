// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

@interface ABI38_0_0EXBaseSensorModule : ABI38_0_0UMExportedModule <ABI38_0_0UMEventEmitter, ABI38_0_0UMModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
