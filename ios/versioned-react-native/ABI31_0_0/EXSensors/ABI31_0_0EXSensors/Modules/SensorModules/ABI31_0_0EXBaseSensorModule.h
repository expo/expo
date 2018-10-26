// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCore/ABI31_0_0EXExportedModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXEventEmitter.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

@interface ABI31_0_0EXBaseSensorModule : ABI31_0_0EXExportedModule <ABI31_0_0EXEventEmitter, ABI31_0_0EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
