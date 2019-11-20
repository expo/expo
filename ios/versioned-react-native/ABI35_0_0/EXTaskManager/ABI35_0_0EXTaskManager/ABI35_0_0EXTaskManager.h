// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitter.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

#import <ABI35_0_0UMTaskManagerInterface/ABI35_0_0UMTaskManagerInterface.h>

@interface ABI35_0_0EXTaskManager : ABI35_0_0UMExportedModule <ABI35_0_0UMInternalModule, ABI35_0_0UMEventEmitter, ABI35_0_0UMModuleRegistryConsumer, ABI35_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
