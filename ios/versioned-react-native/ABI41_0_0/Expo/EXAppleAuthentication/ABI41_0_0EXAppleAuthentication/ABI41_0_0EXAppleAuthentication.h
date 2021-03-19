// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>

@import AuthenticationServices;

@interface ABI41_0_0EXAppleAuthentication : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0UMEventEmitter>

@end
