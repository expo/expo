// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMEventEmitterService.h>

@interface EXWalletModule : UMExportedModule <UMModuleRegistryConsumer, UMEventEmitter>
@end
