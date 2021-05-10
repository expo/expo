// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

#import <ABI40_0_0UMTaskManagerInterface/ABI40_0_0UMTaskManagerInterface.h>

@interface ABI40_0_0EXTaskManager : ABI40_0_0UMExportedModule <ABI40_0_0UMInternalModule, ABI40_0_0UMEventEmitter, ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
