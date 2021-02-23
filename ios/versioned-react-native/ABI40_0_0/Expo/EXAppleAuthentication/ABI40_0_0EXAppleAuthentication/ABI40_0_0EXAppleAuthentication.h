// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>

@import AuthenticationServices;

@interface ABI40_0_0EXAppleAuthentication : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMEventEmitter>

@end
