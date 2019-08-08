// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

#import <UMTaskManagerInterface/UMTaskManagerInterface.h>

@interface EXTaskManager : UMExportedModule <UMInternalModule, UMEventEmitter, UMModuleRegistryConsumer, UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
