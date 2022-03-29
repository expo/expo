// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXTaskManagerInterface.h>

@interface EXTaskManager : EXExportedModule <EXInternalModule, EXEventEmitter, EXModuleRegistryConsumer, EXTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
