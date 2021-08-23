// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

#import <UMTaskManagerInterface/UMTaskManagerInterface.h>

@interface EXTaskManager : EXExportedModule <EXInternalModule, EXEventEmitter, EXModuleRegistryConsumer, UMTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
