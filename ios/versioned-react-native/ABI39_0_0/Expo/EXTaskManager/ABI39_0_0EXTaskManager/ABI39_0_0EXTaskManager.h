// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitter.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

#import <ABI39_0_0UMTaskManagerInterface/ABI39_0_0UMTaskManagerInterface.h>

@interface ABI39_0_0EXTaskManager : ABI39_0_0UMExportedModule <ABI39_0_0UMInternalModule, ABI39_0_0UMEventEmitter, ABI39_0_0UMModuleRegistryConsumer, ABI39_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
