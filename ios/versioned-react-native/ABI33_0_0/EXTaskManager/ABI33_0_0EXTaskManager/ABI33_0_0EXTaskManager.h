// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitter.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

#import <ABI33_0_0UMTaskManagerInterface/ABI33_0_0UMTaskManagerInterface.h>

@interface ABI33_0_0EXTaskManager : ABI33_0_0UMExportedModule <ABI33_0_0UMInternalModule, ABI33_0_0UMEventEmitter, ABI33_0_0UMModuleRegistryConsumer, ABI33_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
