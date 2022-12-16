// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXTaskManagerInterface.h>

@interface ABI45_0_0EXTaskManager : ABI45_0_0EXExportedModule <ABI45_0_0EXInternalModule, ABI45_0_0EXEventEmitter, ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
