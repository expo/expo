// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

#import <ABI38_0_0UMTaskManagerInterface/ABI38_0_0UMTaskManagerInterface.h>

@interface ABI38_0_0EXTaskManager : ABI38_0_0UMExportedModule <ABI38_0_0UMInternalModule, ABI38_0_0UMEventEmitter, ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMTaskManagerInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId NS_DESIGNATED_INITIALIZER;

@end
