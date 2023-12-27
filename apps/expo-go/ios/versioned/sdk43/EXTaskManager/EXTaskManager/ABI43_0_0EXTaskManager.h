// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

#import <ABI43_0_0UMTaskManagerInterface/ABI43_0_0UMTaskManagerInterface.h>

@interface ABI43_0_0EXTaskManager : ABI43_0_0EXExportedModule <ABI43_0_0EXInternalModule, ABI43_0_0EXEventEmitter, ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0UMTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
