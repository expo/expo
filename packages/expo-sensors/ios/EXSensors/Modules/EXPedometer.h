// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@interface EXPedometer : EXExportedModule <EXEventEmitter, EXInternalModule, EXModuleRegistryConsumer>

@end
