// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

#import <ABI32_0_0EXTaskManagerInterface/ABI32_0_0EXTaskManagerInterface.h>

@interface ABI32_0_0EXTaskManager : ABI32_0_0EXExportedModule <ABI32_0_0EXInternalModule, ABI32_0_0EXEventEmitter, ABI32_0_0EXModuleRegistryConsumer, ABI32_0_0EXTaskManagerInterface>

@end
