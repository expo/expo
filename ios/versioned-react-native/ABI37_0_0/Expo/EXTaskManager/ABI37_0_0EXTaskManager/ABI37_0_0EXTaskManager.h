// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskManagerInterface.h>

@interface ABI37_0_0EXTaskManager : ABI37_0_0UMExportedModule <ABI37_0_0UMInternalModule, ABI37_0_0UMEventEmitter, ABI37_0_0UMModuleRegistryConsumer, ABI37_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
