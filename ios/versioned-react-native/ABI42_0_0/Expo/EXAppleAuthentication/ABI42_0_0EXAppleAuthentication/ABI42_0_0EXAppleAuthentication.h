// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>

@import AuthenticationServices;

@interface ABI42_0_0EXAppleAuthentication : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMEventEmitter>

@end
