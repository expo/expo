// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXCore/EXExportedModule.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@interface EXPedometer : EXExportedModule <EXEventEmitter, EXInternalModule, EXModuleRegistryConsumer>

@end
