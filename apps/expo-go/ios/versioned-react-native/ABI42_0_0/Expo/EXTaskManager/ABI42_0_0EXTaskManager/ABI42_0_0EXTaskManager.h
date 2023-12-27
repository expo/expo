// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskManagerInterface.h>

@interface ABI42_0_0EXTaskManager : ABI42_0_0UMExportedModule <ABI42_0_0UMInternalModule, ABI42_0_0UMEventEmitter, ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMTaskManagerInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey NS_DESIGNATED_INITIALIZER;

@end
