// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

#import <ABI41_0_0UMTaskManagerInterface/ABI41_0_0UMTaskManagerInterface.h>

@interface ABI41_0_0EXTaskManager : ABI41_0_0UMExportedModule <ABI41_0_0UMInternalModule, ABI41_0_0UMEventEmitter, ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
