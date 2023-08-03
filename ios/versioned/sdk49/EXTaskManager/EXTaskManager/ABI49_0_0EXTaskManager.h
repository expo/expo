// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXTaskManagerInterface.h>

@interface ABI49_0_0EXTaskManager : ABI49_0_0EXExportedModule <ABI49_0_0EXInternalModule, ABI49_0_0EXEventEmitter, ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
