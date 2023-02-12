// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitter.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitterService.h>

@import AuthenticationServices;

@interface ABI47_0_0EXAppleAuthentication : ABI47_0_0EXExportedModule <ABI47_0_0EXModuleRegistryConsumer, ABI47_0_0EXEventEmitter>

@end
