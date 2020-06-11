// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitterService.h>

@import AuthenticationServices;

@interface ABI38_0_0EXAppleAuthentication : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMEventEmitter>

@end
