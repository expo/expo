// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitter.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

#import <ABI34_0_0UMTaskManagerInterface/ABI34_0_0UMTaskManagerInterface.h>

@interface ABI34_0_0EXTaskManager : ABI34_0_0UMExportedModule <ABI34_0_0UMInternalModule, ABI34_0_0UMEventEmitter, ABI34_0_0UMModuleRegistryConsumer, ABI34_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
