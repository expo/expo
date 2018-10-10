// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXBaseSensorModule : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
