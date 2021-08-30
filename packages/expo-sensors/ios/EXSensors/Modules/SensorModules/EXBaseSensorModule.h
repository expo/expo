// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@interface EXBaseSensorModule : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer>

@property (nonatomic, weak, readonly) id sensorManager;

@end
