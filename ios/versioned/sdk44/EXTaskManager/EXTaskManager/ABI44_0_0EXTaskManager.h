// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

#import <ABI44_0_0UMTaskManagerInterface/ABI44_0_0UMTaskManagerInterface.h>

@interface ABI44_0_0EXTaskManager : ABI44_0_0EXExportedModule <ABI44_0_0EXInternalModule, ABI44_0_0EXEventEmitter, ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0UMTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
