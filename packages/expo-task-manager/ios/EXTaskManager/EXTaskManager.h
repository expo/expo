// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXExportedModule.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

#import <EXTaskManagerInterface/EXTaskManagerInterface.h>

@interface EXTaskManager : EXExportedModule <EXInternalModule, EXEventEmitter, EXModuleRegistryConsumer, EXTaskManagerInterface>

@end
