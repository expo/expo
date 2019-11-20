// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMEventEmitterService.h>

@import AuthenticationServices;

@interface EXAppleAuthentication : UMExportedModule <UMModuleRegistryConsumer, UMEventEmitter>

@end
